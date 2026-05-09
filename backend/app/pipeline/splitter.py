"""Slice a PDF into <= max_pages chunks."""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from pypdf import PdfReader, PdfWriter


@dataclass(frozen=True)
class Chunk:
    path: Path
    page_start: int  # 1-indexed inclusive
    page_end: int    # 1-indexed inclusive

    @property
    def page_ranges(self) -> str:
        return f"{self.page_start}-{self.page_end}"

    @property
    def page_count(self) -> int:
        return self.page_end - self.page_start + 1


def count_pages(src: Path) -> int:
    return len(PdfReader(str(src)).pages)


def split_pdf(src: Path, out_dir: Path, max_pages: int = 200) -> list[Chunk]:
    """If src already <= max_pages, returns one chunk pointing at src.
    Otherwise writes ``chunk_{NN}.pdf`` files into ``out_dir`` and returns those.

    Pages are 1-indexed in the returned ``Chunk`` so the values can be passed
    directly to MinerU's ``page_ranges`` field.
    """
    reader = PdfReader(str(src))
    n = len(reader.pages)
    if n == 0:
        raise ValueError("PDF has zero pages")
    if n <= max_pages:
        return [Chunk(path=src, page_start=1, page_end=n)]

    out_dir.mkdir(parents=True, exist_ok=True)
    chunks: list[Chunk] = []
    width = max(2, len(str((n + max_pages - 1) // max_pages)))
    for idx, start in enumerate(range(0, n, max_pages)):
        end = min(start + max_pages, n)
        writer = PdfWriter()
        for i in range(start, end):
            writer.add_page(reader.pages[i])
        out_path = out_dir / f"chunk_{idx:0{width}d}.pdf"
        with out_path.open("wb") as fh:
            writer.write(fh)
        chunks.append(Chunk(path=out_path, page_start=start + 1, page_end=end))
    return chunks
