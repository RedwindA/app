"""Job CRUD + status."""
from __future__ import annotations

import json
import logging

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from pydantic import BaseModel, Field, ValidationError

from ..auth import require_auth
from ..db import JobStore
from ..pipeline.splitter import count_pages
from ..storage import JobPaths


log = logging.getLogger(__name__)
router = APIRouter()


MAX_UPLOAD_BYTES = 1024 * 1024 * 1024  # 1 GiB hard cap on uploads


class JobMetadata(BaseModel):
    title_main: str = Field(..., min_length=1, max_length=200)
    title_sub: str = Field("", max_length=200)
    authors: list[str] = Field(default_factory=list, max_length=20)
    translator: str = Field("", max_length=200)
    header_left: str = Field("", max_length=100)
    pdf_title: str = Field("", max_length=200)
    pdf_author: str = Field("", max_length=200)


def _store(request: Request) -> JobStore:
    return request.app.state.job_store


def _runner(request: Request):
    return request.app.state.runner


def _settings(request: Request):
    return request.app.state.settings


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_job(
    request: Request,
    file: UploadFile = File(...),
    metadata: str = Form(...),
    _: str = Depends(require_auth),
) -> dict:
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="File must be a PDF (.pdf)")
    try:
        meta_obj = JobMetadata.model_validate_json(metadata)
    except ValidationError as exc:
        raise HTTPException(status_code=400, detail=f"Invalid metadata: {exc.errors()[:3]}") from exc

    settings = _settings(request)
    store = _store(request)
    runner = _runner(request)

    job = await store.create(
        metadata=meta_obj.model_dump(),
        source_pdf_name=file.filename,
    )
    paths = JobPaths.for_job(settings.data_dir, job.id)
    paths.ensure()

    # Stream upload to disk with size cap.
    size = 0
    with paths.input_pdf.open("wb") as fh:
        while True:
            buf = await file.read(1024 * 1024)
            if not buf:
                break
            size += len(buf)
            if size > MAX_UPLOAD_BYTES:
                paths.remove()
                await store.delete(job.id)
                raise HTTPException(status_code=413, detail="Upload exceeds 1 GiB")
            fh.write(buf)

    if size == 0:
        paths.remove()
        await store.delete(job.id)
        raise HTTPException(status_code=400, detail="Empty upload")

    # Validate we can read the PDF before queueing.
    try:
        pages = count_pages(paths.input_pdf)
    except Exception as exc:
        await store.update(job.id, state="failed", error=f"Invalid PDF: {exc}")
        raise HTTPException(status_code=400, detail=f"Invalid PDF: {exc}") from exc

    await store.update(job.id, source_pages=pages)
    await runner.submit(job.id)
    return {"job_id": job.id, "state": job.state, "source_pages": pages}


@router.get("")
async def list_jobs(
    request: Request,
    limit: int = 50,
    _: str = Depends(require_auth),
) -> list[dict]:
    limit = max(1, min(500, limit))
    jobs = await _store(request).list(limit=limit)
    return [j.to_api() for j in jobs]


@router.get("/{job_id}")
async def get_job(
    request: Request,
    job_id: str,
    _: str = Depends(require_auth),
) -> dict:
    job = await _store(request).get(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return job.to_api()


@router.post("/{job_id}/cancel")
async def cancel_job(
    request: Request,
    job_id: str,
    _: str = Depends(require_auth),
) -> dict:
    store = _store(request)
    job = await store.get(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.state in {"done", "failed"}:
        return {"ok": True, "already_terminal": True}
    await store.update(job_id, cancel_requested=True)
    return {"ok": True}


@router.post("/{job_id}/rebuild")
async def rebuild_job(
    request: Request,
    job_id: str,
    _: str = Depends(require_auth),
) -> dict:
    """Re-run merge + compile from cached MinerU zips, no MinerU calls.

    Useful after a latex compile failure: the OCR work is preserved, only the
    builder logic is re-applied (e.g. after a builder bugfix or metadata edit).
    Requires that ``/data/jobs/<id>/mineru/chunk_*.zip`` exist.
    """
    store = _store(request)
    settings = _settings(request)
    runner = _runner(request)
    job = await store.get(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    paths = JobPaths.for_job(settings.data_dir, job_id)
    cached = sorted(paths.mineru_dir.glob("chunk_*.zip")) if paths.mineru_dir.exists() else []
    if not cached:
        raise HTTPException(
            status_code=409,
            detail="No cached MinerU zips for this job; re-upload to redo OCR.",
        )
    await store.update(
        job_id,
        state="latex_merging",
        progress=85,
        stage_detail="rebuild requested",
        cancel_requested=False,
        error=None,
        output_pdf_path=None,
    )
    await runner.submit(job_id)
    return {"ok": True, "cached_zips": len(cached)}


@router.delete("/{job_id}")
async def delete_job(
    request: Request,
    job_id: str,
    _: str = Depends(require_auth),
) -> dict:
    store = _store(request)
    settings = _settings(request)
    job = await store.get(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    paths = JobPaths.for_job(settings.data_dir, job_id)
    paths.remove()
    await store.delete(job_id)
    return {"ok": True}
