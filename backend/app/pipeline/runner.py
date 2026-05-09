"""Single-worker async job runner. State machine + MinerU + builder."""
from __future__ import annotations

import asyncio
import json
import logging
import shutil
from pathlib import Path
from typing import Any

from ..config import Settings
from ..db import Job, JobStore
from ..storage import JobPaths, safe_filename
from .builder import BookMeta, LatexCompileError, PartInput, build_book
from .mineru_client import AsyncMineruClient, MineruError
from .splitter import Chunk, count_pages, split_pdf


log = logging.getLogger(__name__)


# Progress weights (start, end) for each non-terminal stage.
_STAGE_RANGE = {
    "splitting": (0, 5),
    "mineru_uploading": (5, 10),
    "mineru_processing": (10, 80),
    "mineru_downloading": (80, 85),
    "latex_merging": (85, 88),
    "latex_compiling": (88, 99),
}


class JobCancelled(Exception):
    """User flagged cancel_requested mid-run."""


class JobRunner:
    """Owns a queue + worker task. One job at a time (concurrency 1)."""

    def __init__(self, settings: Settings, store: JobStore) -> None:
        self._settings = settings
        self._store = store
        self._queue: asyncio.Queue[str] = asyncio.Queue()
        self._task: asyncio.Task[None] | None = None
        self._stopping = False

    async def start(self) -> None:
        # Resume / fail jobs left in non-terminal states.
        for job in await self._store.list_non_terminal():
            if job.state == "mineru_processing" and job.mineru_batch_id:
                log.info("Resuming job %s in mineru_processing (batch %s)", job.id, job.mineru_batch_id)
                await self._queue.put(job.id)
            else:
                await self._store.update(
                    job.id,
                    state="failed",
                    error="interrupted by restart; please retry",
                    progress=0,
                    stage_detail=None,
                )
        self._task = asyncio.create_task(self._loop(), name="job-runner")

    async def stop(self) -> None:
        self._stopping = True
        if self._task is not None:
            self._task.cancel()
            try:
                await self._task
            except (asyncio.CancelledError, BaseException):
                pass
            self._task = None

    async def submit(self, job_id: str) -> None:
        await self._queue.put(job_id)

    async def _loop(self) -> None:
        while not self._stopping:
            try:
                job_id = await self._queue.get()
            except asyncio.CancelledError:
                return
            try:
                await self._run(job_id)
            except JobCancelled:
                await self._store.update(job_id, state="failed", error="cancelled by user", progress=0)
            except MineruError as exc:
                log.warning("Job %s failed: MinerU %s", job_id, exc)
                await self._store.update(job_id, state="failed", error=str(exc))
            except LatexCompileError as exc:
                log.warning("Job %s latex compile failed", job_id)
                detail = f"latexmk error\n\n{exc}\n\n--- log tail ---\n{exc.log_tail}"
                await self._store.update(job_id, state="failed", error=detail)
            except Exception as exc:  # pragma: no cover - defensive catch-all
                log.exception("Job %s crashed", job_id)
                await self._store.update(job_id, state="failed", error=f"internal error: {exc!r}")
            finally:
                # Prune retention after every completion.
                try:
                    removed = await self._store.prune(self._settings.max_job_history)
                except Exception:  # pragma: no cover
                    log.exception("Prune failed")
                    removed = []
                for rid in removed:
                    paths = JobPaths.for_job(self._settings.data_dir, rid)
                    paths.remove()

    # ---- core run ----
    async def _run(self, job_id: str) -> None:
        job = await self._store.get(job_id)
        if job is None:
            return
        await self._check_cancel(job_id)
        paths = JobPaths.for_job(self._settings.data_dir, job_id)
        paths.ensure()
        meta = BookMeta(**{k: v for k, v in job.metadata.items() if k in BookMeta.__dataclass_fields__})

        # Rebuild path: zips already on disk from a prior successful MinerU run.
        cached_zips = self._cached_zips(paths)
        if job.state == "latex_merging" and cached_zips:
            log.info("Job %s rebuild: skipping MinerU, using %d cached zip(s)", job_id, len(cached_zips))
            await self._stage_build(job_id, paths, meta, cached_zips)
            return

        # 1. Split (or resume from MinerU mid-run)
        if job.state == "mineru_processing" and job.mineru_batch_id:
            chunks = self._chunks_from_state(job)
        else:
            chunks = await self._stage_split(job_id, paths)

        # 2. Submit batch (skip if resuming)
        if job.state == "mineru_processing" and job.mineru_batch_id:
            batch_id = job.mineru_batch_id
            zip_paths = await self._poll_and_download(job_id, paths, batch_id, chunks)
        else:
            batch_id, file_urls = await self._stage_request_batch(job_id, chunks)
            await self._store.update(job_id, mineru_batch_id=batch_id)
            await self._stage_upload(job_id, chunks, file_urls)
            zip_paths = await self._poll_and_download(job_id, paths, batch_id, chunks)

        # 3. Merge + compile
        await self._stage_build(job_id, paths, meta, zip_paths)

    def _cached_zips(self, paths: JobPaths) -> list[Path]:
        if not paths.mineru_dir.exists():
            return []
        return sorted(paths.mineru_dir.glob("chunk_*.zip"))

    def _chunks_from_state(self, job: Job) -> list[Chunk]:
        """Reconstruct ``Chunk`` list from the saved mineru_state for resume."""
        state = job.mineru_state or {}
        ch = state.get("chunks") or []
        if not ch:
            raise RuntimeError("Cannot resume: no saved chunk state on job")
        return [
            Chunk(path=Path(c["path"]), page_start=int(c["page_start"]), page_end=int(c["page_end"]))
            for c in ch
        ]

    # ---- stages ----
    async def _stage_split(self, job_id: str, paths: JobPaths) -> list[Chunk]:
        await self._set_stage(job_id, "splitting", 0, "counting pages")
        total_pages = await asyncio.to_thread(count_pages, paths.input_pdf)
        await self._store.update(job_id, source_pages=total_pages)
        await self._set_stage(job_id, "splitting", 2, f"splitting {total_pages} pages")
        chunks = await asyncio.to_thread(
            split_pdf, paths.input_pdf, paths.parts_dir, self._settings.chunk_pages
        )
        # Persist for resume.
        state = {
            "chunks": [
                {"path": str(c.path), "page_start": c.page_start, "page_end": c.page_end}
                for c in chunks
            ],
            "files": [],
        }
        await self._store.update(job_id, mineru_state=state)
        await self._progress(job_id, "splitting", 1.0, f"{len(chunks)} chunk(s)")
        return chunks

    async def _stage_request_batch(
        self, job_id: str, chunks: list[Chunk]
    ) -> tuple[str, list[str]]:
        await self._set_stage(job_id, "mineru_uploading", 5, "requesting upload URLs")
        client = self._mineru()
        files = [
            {
                "name": c.path.name,
                "is_ocr": True,
                "page_ranges": "1-" + str(c.page_count),
                "data_id": f"chunk_{i:02d}",
            }
            for i, c in enumerate(chunks)
        ]
        result = await client.request_batch_upload(files)
        return result.batch_id, result.file_urls

    async def _stage_upload(
        self, job_id: str, chunks: list[Chunk], file_urls: list[str]
    ) -> None:
        await self._set_stage(job_id, "mineru_uploading", 7, "uploading chunks")
        client = self._mineru()
        await client.upload_chunks(file_urls, [c.path for c in chunks])
        await self._set_stage(job_id, "mineru_processing", 10, "uploaded; awaiting MinerU")

    async def _poll_and_download(
        self, job_id: str, paths: JobPaths, batch_id: str, chunks: list[Chunk]
    ) -> list[Path]:
        client = self._mineru()
        total_total_pages = sum(c.page_count for c in chunks)
        zip_paths: list[Path | None] = [None] * len(chunks)
        # Map chunk filename → index for matching upstream results.
        name_to_idx = {c.path.name: i for i, c in enumerate(chunks)}

        while True:
            await self._check_cancel(job_id)
            poll = await client.poll_batch(batch_id)
            extracted_total = 0
            mineru_state_files: list[dict[str, Any]] = []
            all_done = True
            failed_msg: str | None = None
            for fr in poll.files:
                idx = name_to_idx.get(fr.file_name, -1)
                mineru_state_files.append({
                    "file_name": fr.file_name,
                    "state": fr.state,
                    "extracted_pages": fr.extracted_pages,
                    "total_pages": fr.total_pages,
                    "err_msg": fr.err_msg,
                })
                if fr.state == "failed":
                    failed_msg = fr.err_msg or f"MinerU failed on {fr.file_name}"
                    all_done = False
                elif fr.state != "done":
                    all_done = False
                if fr.state == "done" and idx >= 0 and zip_paths[idx] is None and fr.full_zip_url:
                    extracted_total += chunks[idx].page_count
                else:
                    extracted_total += fr.extracted_pages
            # Persist progress + mineru_state
            stored = await self._store.get(job_id)
            existing_state = stored.mineru_state if stored else None
            new_state = {
                "chunks": (existing_state or {}).get("chunks") if existing_state else None,
                "files": mineru_state_files,
                "batch_id": batch_id,
            }
            if not new_state["chunks"]:
                new_state["chunks"] = [
                    {"path": str(c.path), "page_start": c.page_start, "page_end": c.page_end}
                    for c in chunks
                ]
            ratio = (extracted_total / total_total_pages) if total_total_pages else 0.0
            ratio = max(0.0, min(1.0, ratio))
            await self._progress(
                job_id, "mineru_processing", ratio,
                stage_detail=f"{extracted_total}/{total_total_pages} pages",
                mineru_state=new_state,
            )
            if failed_msg:
                raise MineruError(failed_msg)
            if all_done:
                break
            await asyncio.sleep(self._settings.mineru_poll_interval_s)

        # Download each ZIP, in order.
        await self._set_stage(job_id, "mineru_downloading", 80, "downloading ZIPs")
        url_by_name = {fr.file_name: fr.full_zip_url for fr in poll.files}
        for i, c in enumerate(chunks):
            url = url_by_name.get(c.path.name)
            if not url:
                raise MineruError(f"Missing full_zip_url for {c.path.name}")
            dest = paths.mineru_dir / f"chunk_{i:02d}.zip"
            await client.download(url, dest)
            zip_paths[i] = dest
            ratio = (i + 1) / len(chunks)
            await self._progress(job_id, "mineru_downloading", ratio, f"{i+1}/{len(chunks)} downloaded")
        return [p for p in zip_paths if p is not None]

    async def _stage_build(
        self, job_id: str, paths: JobPaths, meta: BookMeta, zip_paths: list[Path]
    ) -> None:
        await self._set_stage(job_id, "latex_merging", 85, "stitching parts")
        parts = [PartInput(kind="zip", path=p) for p in zip_paths]

        def _do_build() -> Path:
            return build_book(
                parts, meta, paths.root,
                compile_timeout_s=self._settings.latex_compile_timeout_s,
            )

        await self._set_stage(job_id, "latex_compiling", 90, "running latexmk")
        # Compile in a thread; cancellation polled before/after only.
        await self._check_cancel(job_id)
        pdf_path = await asyncio.to_thread(_do_build)
        await self._check_cancel(job_id)

        # Copy to out_dir with a friendly filename.
        title_safe = safe_filename(meta.with_defaults().title_main)
        out_pdf = paths.out_dir / f"{title_safe}.pdf"
        shutil.copy2(pdf_path, out_pdf)

        await self._store.update(
            job_id,
            state="done",
            progress=100,
            stage_detail="complete",
            output_pdf_path=str(out_pdf),
            error=None,
        )

    # ---- helpers ----
    def _mineru(self) -> AsyncMineruClient:
        return AsyncMineruClient(
            self._settings.mineru_token,
            base_url=self._settings.mineru_base_url,
        )

    async def _check_cancel(self, job_id: str) -> None:
        job = await self._store.get(job_id)
        if job is None or job.cancel_requested:
            raise JobCancelled()

    async def _set_stage(self, job_id: str, state: str, progress: int, detail: str) -> None:
        await self._store.update(job_id, state=state, progress=progress, stage_detail=detail)

    async def _progress(
        self,
        job_id: str,
        state: str,
        ratio: float,
        stage_detail: str,
        *,
        mineru_state: dict[str, Any] | None = None,
    ) -> None:
        lo, hi = _STAGE_RANGE[state]
        pct = int(round(lo + (hi - lo) * max(0.0, min(1.0, ratio))))
        kwargs: dict[str, Any] = {"state": state, "progress": pct, "stage_detail": stage_detail}
        if mineru_state is not None:
            kwargs["mineru_state"] = mineru_state
        await self._store.update(job_id, **kwargs)
