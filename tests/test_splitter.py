"""Synthetic-PDF tests for the splitter."""
from __future__ import annotations

from pathlib import Path

import pytest
from pypdf import PdfReader, PdfWriter

from app.pipeline.splitter import Chunk, count_pages, split_pdf


def _make_pdf(path: Path, n: int) -> Path:
    """Build a tiny PDF with ``n`` blank pages (LETTER, no content stream)."""
    w = PdfWriter()
    for _ in range(n):
        w.add_blank_page(width=72, height=72)
    with path.open("wb") as fh:
        w.write(fh)
    return path


@pytest.mark.parametrize("n", [1, 200])
def test_split_short_returns_single(tmp_path: Path, n: int) -> None:
    src = _make_pdf(tmp_path / "src.pdf", n)
    chunks = split_pdf(src, tmp_path / "out", max_pages=200)
    assert len(chunks) == 1
    assert chunks[0].path == src
    assert (chunks[0].page_start, chunks[0].page_end) == (1, n)
    assert chunks[0].page_count == n


def test_split_just_over_threshold(tmp_path: Path) -> None:
    src = _make_pdf(tmp_path / "src.pdf", 201)
    chunks = split_pdf(src, tmp_path / "out", max_pages=200)
    assert len(chunks) == 2
    assert (chunks[0].page_start, chunks[0].page_end) == (1, 200)
    assert (chunks[1].page_start, chunks[1].page_end) == (201, 201)
    # Re-read written chunks to confirm pypdf produced valid PDFs
    assert len(PdfReader(str(chunks[0].path)).pages) == 200
    assert len(PdfReader(str(chunks[1].path)).pages) == 1


def test_split_500_pages(tmp_path: Path) -> None:
    src = _make_pdf(tmp_path / "src.pdf", 500)
    chunks = split_pdf(src, tmp_path / "out", max_pages=200)
    assert [c.page_count for c in chunks] == [200, 200, 100]
    assert chunks[-1].page_end == 500
    # Page ranges are 1-based and contiguous
    flat = [(c.page_start, c.page_end) for c in chunks]
    assert flat == [(1, 200), (201, 400), (401, 500)]


def test_count_pages_matches(tmp_path: Path) -> None:
    src = _make_pdf(tmp_path / "src.pdf", 17)
    assert count_pages(src) == 17


def test_chunk_page_ranges_string() -> None:
    c = Chunk(path=Path("/tmp/x.pdf"), page_start=5, page_end=20)
    assert c.page_ranges == "5-20"
    assert c.page_count == 16


def test_zero_page_pdf_raises(tmp_path: Path) -> None:
    src = _make_pdf(tmp_path / "src.pdf", 0)
    with pytest.raises(ValueError):
        split_pdf(src, tmp_path / "out", max_pages=200)
