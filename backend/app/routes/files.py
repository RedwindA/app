"""File downloads: PDF, range-supporting preview, latexmk log."""
from __future__ import annotations

import os
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import FileResponse, StreamingResponse, PlainTextResponse

from ..auth import require_auth
from ..storage import JobPaths


router = APIRouter()


def _store(request: Request):
    return request.app.state.job_store


def _settings(request: Request):
    return request.app.state.settings


async def _resolve_pdf(request: Request, job_id: str) -> Path:
    job = await _store(request).get(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    if not job.output_pdf_path:
        raise HTTPException(status_code=409, detail="PDF not ready")
    p = Path(job.output_pdf_path)
    if not p.exists():
        raise HTTPException(status_code=410, detail="PDF missing on disk")
    return p


@router.get("/{job_id}/pdf")
async def download_pdf(
    request: Request,
    job_id: str,
    _: str = Depends(require_auth),
) -> FileResponse:
    pdf = await _resolve_pdf(request, job_id)
    return FileResponse(
        pdf,
        media_type="application/pdf",
        filename=pdf.name,
    )


def _parse_range(header: str | None, file_size: int) -> tuple[int, int] | None:
    if not header or not header.startswith("bytes="):
        return None
    try:
        spec = header[len("bytes="):].split(",", 1)[0].strip()
        start_s, end_s = spec.split("-", 1)
        start = int(start_s) if start_s else 0
        end = int(end_s) if end_s else file_size - 1
    except ValueError:
        return None
    if start < 0 or end >= file_size or start > end:
        return None
    return start, end


@router.get("/{job_id}/preview")
async def preview_pdf(
    request: Request,
    job_id: str,
    _: str = Depends(require_auth),
) -> Response:
    """Range-supporting endpoint. Frontend fetches via authed axios as Blob."""
    pdf = await _resolve_pdf(request, job_id)
    file_size = pdf.stat().st_size
    range_header = request.headers.get("range") or request.headers.get("Range")
    rng = _parse_range(range_header, file_size)

    common_headers = {
        "Accept-Ranges": "bytes",
        "Content-Type": "application/pdf",
        "Cache-Control": "private, max-age=60",
    }

    if rng is None:
        async def whole() -> Response:
            return FileResponse(pdf, media_type="application/pdf", headers=common_headers)
        return await whole()

    start, end = rng
    length = end - start + 1

    def iterfile():
        with pdf.open("rb") as fh:
            fh.seek(start)
            remaining = length
            while remaining > 0:
                buf = fh.read(min(64 * 1024, remaining))
                if not buf:
                    break
                remaining -= len(buf)
                yield buf

    headers = {
        **common_headers,
        "Content-Range": f"bytes {start}-{end}/{file_size}",
        "Content-Length": str(length),
    }
    return StreamingResponse(iterfile(), status_code=206, headers=headers, media_type="application/pdf")


@router.get("/{job_id}/log")
async def latexmk_log(
    request: Request,
    job_id: str,
    _: str = Depends(require_auth),
) -> PlainTextResponse:
    job = await _store(request).get(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    settings = _settings(request)
    paths = JobPaths.for_job(settings.data_dir, job_id)
    if not paths.latex_log.exists():
        raise HTTPException(status_code=404, detail="No latex log yet")
    text = paths.latex_log.read_text(encoding="utf-8", errors="replace")
    return PlainTextResponse(text)
