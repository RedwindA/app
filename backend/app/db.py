"""Async SQLite-backed job store."""
from __future__ import annotations

import json
import time
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import aiosqlite


SCHEMA = """
CREATE TABLE IF NOT EXISTS jobs (
    id              TEXT PRIMARY KEY,
    created_at      INTEGER NOT NULL,
    updated_at      INTEGER NOT NULL,
    state           TEXT NOT NULL,
    progress        INTEGER NOT NULL DEFAULT 0,
    stage_detail    TEXT,
    metadata_json   TEXT NOT NULL,
    source_pdf_name TEXT,
    source_pages    INTEGER,
    mineru_batch_id TEXT,
    mineru_state_json TEXT,
    output_pdf_path TEXT,
    error           TEXT,
    cancel_requested INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_state ON jobs(state);
"""


TERMINAL_STATES = {"done", "failed"}
NON_TERMINAL_STATES = {
    "queued", "splitting", "mineru_uploading", "mineru_processing",
    "mineru_downloading", "latex_merging", "latex_compiling",
}


@dataclass
class Job:
    id: str
    created_at: int
    updated_at: int
    state: str
    progress: int
    stage_detail: str | None
    metadata: dict[str, Any]
    source_pdf_name: str | None
    source_pages: int | None
    mineru_batch_id: str | None
    mineru_state: dict[str, Any] | None
    output_pdf_path: str | None
    error: str | None
    cancel_requested: bool = False

    def to_api(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "state": self.state,
            "progress": self.progress,
            "stage_detail": self.stage_detail,
            "metadata": self.metadata,
            "source_pdf_name": self.source_pdf_name,
            "source_pages": self.source_pages,
            "mineru_state": self.mineru_state,
            "output_pdf_path": self.output_pdf_path,
            "error": self.error,
            "cancel_requested": self.cancel_requested,
        }


def _row_to_job(row: aiosqlite.Row) -> Job:
    return Job(
        id=row["id"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
        state=row["state"],
        progress=row["progress"],
        stage_detail=row["stage_detail"],
        metadata=json.loads(row["metadata_json"] or "{}"),
        source_pdf_name=row["source_pdf_name"],
        source_pages=row["source_pages"],
        mineru_batch_id=row["mineru_batch_id"],
        mineru_state=json.loads(row["mineru_state_json"]) if row["mineru_state_json"] else None,
        output_pdf_path=row["output_pdf_path"],
        error=row["error"],
        cancel_requested=bool(row["cancel_requested"]),
    )


def now_s() -> int:
    return int(time.time())


def new_job_id() -> str:
    return uuid.uuid4().hex


class JobStore:
    """Thin async wrapper. Open one connection for the app lifetime."""

    def __init__(self, db_path: Path) -> None:
        self._db_path = db_path
        self._conn: aiosqlite.Connection | None = None

    async def open(self) -> None:
        self._db_path.parent.mkdir(parents=True, exist_ok=True)
        self._conn = await aiosqlite.connect(self._db_path)
        self._conn.row_factory = aiosqlite.Row
        await self._conn.executescript(SCHEMA)
        await self._conn.commit()

    async def close(self) -> None:
        if self._conn is not None:
            await self._conn.close()
            self._conn = None

    @property
    def conn(self) -> aiosqlite.Connection:
        assert self._conn is not None, "JobStore.open() must be called first"
        return self._conn

    async def create(
        self,
        *,
        metadata: dict[str, Any],
        source_pdf_name: str,
    ) -> Job:
        job_id = new_job_id()
        now = now_s()
        await self.conn.execute(
            "INSERT INTO jobs(id, created_at, updated_at, state, progress, metadata_json, source_pdf_name) "
            "VALUES (?, ?, ?, 'queued', 0, ?, ?)",
            (job_id, now, now, json.dumps(metadata, ensure_ascii=False), source_pdf_name),
        )
        await self.conn.commit()
        job = await self.get(job_id)
        assert job is not None
        return job

    async def get(self, job_id: str) -> Job | None:
        async with self.conn.execute("SELECT * FROM jobs WHERE id = ?", (job_id,)) as cur:
            row = await cur.fetchone()
        return _row_to_job(row) if row else None

    async def list(self, limit: int = 50) -> list[Job]:
        async with self.conn.execute(
            "SELECT * FROM jobs ORDER BY created_at DESC LIMIT ?", (limit,)
        ) as cur:
            rows = await cur.fetchall()
        return [_row_to_job(r) for r in rows]

    async def list_non_terminal(self) -> list[Job]:
        placeholders = ",".join("?" * len(NON_TERMINAL_STATES))
        states = tuple(NON_TERMINAL_STATES)
        async with self.conn.execute(
            f"SELECT * FROM jobs WHERE state IN ({placeholders}) ORDER BY created_at ASC", states
        ) as cur:
            rows = await cur.fetchall()
        return [_row_to_job(r) for r in rows]

    async def update(
        self,
        job_id: str,
        *,
        state: str | None = None,
        progress: int | None = None,
        stage_detail: str | None = None,
        source_pages: int | None = None,
        mineru_batch_id: str | None = None,
        mineru_state: dict[str, Any] | None = None,
        output_pdf_path: str | None = None,
        error: str | None = None,
        cancel_requested: bool | None = None,
    ) -> None:
        sets: list[str] = ["updated_at = ?"]
        vals: list[Any] = [now_s()]
        if state is not None:
            sets.append("state = ?"); vals.append(state)
        if progress is not None:
            sets.append("progress = ?"); vals.append(int(progress))
        if stage_detail is not None:
            sets.append("stage_detail = ?"); vals.append(stage_detail)
        if source_pages is not None:
            sets.append("source_pages = ?"); vals.append(int(source_pages))
        if mineru_batch_id is not None:
            sets.append("mineru_batch_id = ?"); vals.append(mineru_batch_id)
        if mineru_state is not None:
            sets.append("mineru_state_json = ?"); vals.append(json.dumps(mineru_state, ensure_ascii=False))
        if output_pdf_path is not None:
            sets.append("output_pdf_path = ?"); vals.append(output_pdf_path)
        if error is not None:
            sets.append("error = ?"); vals.append(error)
        if cancel_requested is not None:
            sets.append("cancel_requested = ?"); vals.append(1 if cancel_requested else 0)
        vals.append(job_id)
        await self.conn.execute(f"UPDATE jobs SET {', '.join(sets)} WHERE id = ?", vals)
        await self.conn.commit()

    async def delete(self, job_id: str) -> None:
        await self.conn.execute("DELETE FROM jobs WHERE id = ?", (job_id,))
        await self.conn.commit()

    async def prune(self, keep: int) -> list[str]:
        """Drop oldest rows beyond `keep`. Return removed job_ids so caller can rmtree."""
        async with self.conn.execute(
            "SELECT id FROM jobs ORDER BY created_at DESC LIMIT -1 OFFSET ?", (keep,)
        ) as cur:
            rows = await cur.fetchall()
        ids = [r["id"] for r in rows]
        if ids:
            placeholders = ",".join("?" * len(ids))
            await self.conn.execute(f"DELETE FROM jobs WHERE id IN ({placeholders})", ids)
            await self.conn.commit()
        return ids
