"""Thin async client for MinerU's batch upload + extract API.

Token never leaves backend; never logged.
"""
from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import httpx


log = logging.getLogger(__name__)


class MineruError(Exception):
    """Caller-facing error. ``code`` is MinerU's numeric code if known."""

    def __init__(self, message: str, *, code: int | str | None = None, retriable: bool = False) -> None:
        super().__init__(message)
        self.code = code
        self.retriable = retriable


@dataclass
class BatchSubmitResult:
    batch_id: str
    file_urls: list[str]


@dataclass
class FileResult:
    file_name: str
    state: str  # waiting-file | pending | running | converting | done | failed
    extracted_pages: int = 0
    total_pages: int = 0
    full_zip_url: str | None = None
    err_msg: str | None = None
    data_id: str | None = None


@dataclass
class BatchPollResult:
    batch_id: str
    files: list[FileResult]


class AsyncMineruClient:
    """Wraps the four MinerU calls we need.

    All HTTP retries are exponential backoff x3 on transport errors / 5xx.
    Auth and quota errors are surfaced as ``MineruError`` immediately.
    """

    def __init__(
        self,
        token: str,
        *,
        base_url: str = "https://mineru.net",
        timeout: float = 60.0,
    ) -> None:
        self._token = token
        self._base = base_url.rstrip("/")
        self._timeout = timeout

    def _client(self) -> httpx.AsyncClient:
        return httpx.AsyncClient(
            timeout=self._timeout,
            headers={"Authorization": f"Bearer {self._token}"},
        )

    @staticmethod
    def _classify(code: int | str | None, msg: str | None) -> MineruError:
        m = msg or ""
        if code in ("A0202", "A0211"):
            return MineruError("MinerU authentication failed — check MINERU_TOKEN", code=code)
        if code == -60018:
            return MineruError("MinerU daily quota exceeded — try again tomorrow", code=code)
        if code == -60005:
            return MineruError("File exceeds MinerU 200 MB limit", code=code)
        if code == -60006:
            return MineruError("Chunk exceeds MinerU 200 page limit — split smaller", code=code)
        return MineruError(f"MinerU error{f' ({code})' if code is not None else ''}: {m}".strip(), code=code)

    async def _post_json(self, url: str, payload: dict) -> dict:
        last_exc: Exception | None = None
        for attempt in range(3):
            try:
                async with self._client() as c:
                    r = await c.post(url, json=payload)
            except (httpx.TransportError, httpx.TimeoutException) as exc:
                last_exc = exc
                await asyncio.sleep(2 ** attempt)
                continue
            if r.status_code in (401, 403):
                raise MineruError("MinerU authentication failed — check MINERU_TOKEN", code=r.status_code)
            if r.status_code >= 500:
                last_exc = RuntimeError(f"{r.status_code}: {r.text[:200]}")
                await asyncio.sleep(2 ** attempt)
                continue
            r.raise_for_status()
            data = r.json()
            if data.get("code") not in (0, "0"):
                raise self._classify(data.get("code"), data.get("msg"))
            return data
        raise MineruError(f"MinerU request failed after retries: {last_exc!r}", retriable=True)

    async def _get_json(self, url: str) -> dict:
        last_exc: Exception | None = None
        for attempt in range(3):
            try:
                async with self._client() as c:
                    r = await c.get(url)
            except (httpx.TransportError, httpx.TimeoutException) as exc:
                last_exc = exc
                await asyncio.sleep(2 ** attempt)
                continue
            if r.status_code in (401, 403):
                raise MineruError("MinerU authentication failed — check MINERU_TOKEN", code=r.status_code)
            if r.status_code >= 500:
                last_exc = RuntimeError(f"{r.status_code}: {r.text[:200]}")
                await asyncio.sleep(2 ** attempt)
                continue
            r.raise_for_status()
            data = r.json()
            if data.get("code") not in (0, "0"):
                raise self._classify(data.get("code"), data.get("msg"))
            return data
        raise MineruError(f"MinerU request failed after retries: {last_exc!r}", retriable=True)

    async def request_batch_upload(
        self,
        files: list[dict[str, Any]],
        *,
        model_version: str = "vlm",
        language: str = "ch",
        enable_formula: bool = True,
        enable_table: bool = True,
        extra_formats: list[str] | None = None,
    ) -> BatchSubmitResult:
        """``files``: each ``{name, page_ranges, is_ocr, data_id?}``."""
        payload: dict[str, Any] = {
            "files": files,
            "model_version": model_version,
            "language": language,
            "enable_formula": enable_formula,
            "enable_table": enable_table,
            "extra_formats": list(extra_formats) if extra_formats else ["latex"],
        }
        data = await self._post_json(f"{self._base}/api/v4/file-urls/batch", payload)
        d = data.get("data") or {}
        batch_id = d.get("batch_id")
        urls = d.get("file_urls") or []
        if not batch_id or len(urls) != len(files):
            raise MineruError(f"MinerU batch submission returned malformed response: {d!r}")
        return BatchSubmitResult(batch_id=batch_id, file_urls=urls)

    async def upload_chunk(self, url: str, path: Path) -> None:
        """PUT raw bytes to a presigned URL. **Must not** set Content-Type."""
        # Use a fresh client without the auth header (presigned URL).
        last_exc: Exception | None = None
        for attempt in range(3):
            try:
                async with httpx.AsyncClient(timeout=self._timeout * 5) as c:
                    with path.open("rb") as fh:
                        r = await c.put(url, content=fh.read())
            except (httpx.TransportError, httpx.TimeoutException) as exc:
                last_exc = exc
                await asyncio.sleep(2 ** attempt)
                continue
            if r.status_code >= 500:
                last_exc = RuntimeError(f"{r.status_code}: {r.text[:200]}")
                await asyncio.sleep(2 ** attempt)
                continue
            if r.status_code >= 400:
                raise MineruError(f"Upload PUT failed ({r.status_code}): {r.text[:200]}")
            return
        raise MineruError(f"Upload PUT failed after retries: {last_exc!r}", retriable=True)

    async def upload_chunks(self, urls: list[str], paths: list[Path]) -> None:
        await asyncio.gather(*(self.upload_chunk(u, p) for u, p in zip(urls, paths)))

    async def poll_batch(self, batch_id: str) -> BatchPollResult:
        data = await self._get_json(f"{self._base}/api/v4/extract-results/batch/{batch_id}")
        d = data.get("data") or {}
        results: list[FileResult] = []
        for entry in d.get("extract_result", []) or []:
            ep = entry.get("extract_progress") or {}
            results.append(FileResult(
                file_name=entry.get("file_name", ""),
                state=entry.get("state", "pending"),
                extracted_pages=int(ep.get("extracted_pages") or 0),
                total_pages=int(ep.get("total_pages") or 0),
                full_zip_url=entry.get("full_zip_url"),
                err_msg=entry.get("err_msg"),
                data_id=entry.get("data_id"),
            ))
        return BatchPollResult(batch_id=batch_id, files=results)

    async def download(self, url: str, dest: Path) -> None:
        dest.parent.mkdir(parents=True, exist_ok=True)
        async with httpx.AsyncClient(timeout=self._timeout * 5, follow_redirects=True) as c:
            async with c.stream("GET", url) as r:
                r.raise_for_status()
                with dest.open("wb") as fh:
                    async for buf in r.aiter_bytes():
                        fh.write(buf)
