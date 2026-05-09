"""Filesystem layout for a single job under DATA_DIR."""
from __future__ import annotations

import re
import shutil
from dataclasses import dataclass
from pathlib import Path


_SAFE_NAME = re.compile(r"[^A-Za-z0-9._\-一-鿿]+")


def safe_filename(name: str, default: str = "book") -> str:
    """Sanitize for filesystem use; keep CJK; collapse other punctuation."""
    name = name.strip().replace("/", "_").replace("\\", "_")
    cleaned = _SAFE_NAME.sub("_", name).strip("._")
    return cleaned or default


@dataclass(frozen=True)
class JobPaths:
    job_id: str
    root: Path

    @classmethod
    def for_job(cls, data_dir: Path, job_id: str) -> "JobPaths":
        return cls(job_id=job_id, root=data_dir / "jobs" / job_id)

    @property
    def input_pdf(self) -> Path: return self.root / "input.pdf"
    @property
    def parts_dir(self) -> Path: return self.root / "parts"
    @property
    def mineru_dir(self) -> Path: return self.root / "mineru"
    @property
    def extract_dir(self) -> Path: return self.root / "extracts"
    @property
    def build_dir(self) -> Path: return self.root / "build"
    @property
    def out_dir(self) -> Path: return self.root / "out"
    @property
    def runner_log(self) -> Path: return self.root / "runner.log"
    @property
    def latex_log(self) -> Path: return self.build_dir / "book.log"

    def ensure(self) -> None:
        for d in (self.root, self.parts_dir, self.mineru_dir, self.extract_dir, self.build_dir, self.out_dir):
            d.mkdir(parents=True, exist_ok=True)

    def remove(self) -> None:
        if self.root.exists():
            shutil.rmtree(self.root, ignore_errors=True)
