"""Builder integration test using the existing fixtures.

The actual latexmk run is gated by ``pytest.mark.requires_latex`` so unit-only
runs can succeed on machines without TeX Live.
"""
from __future__ import annotations

import shutil
from pathlib import Path

import pytest

from app.pipeline.builder import (
    BookMeta,
    PartInput,
    _build_preamble,
    _extra_package_lines,
    _extra_support_lines,
    _packages_in,
    build_book,
)


FIXTURE_DIR = Path("/home/austin/latex-workspace")
PART1_ZIP = FIXTURE_DIR / "1-200.zip"
PART2_ZIP = FIXTURE_DIR / "201-400.zip"
PART3_TEX = FIXTURE_DIR / "401-524.tex"


def _have_fixtures() -> bool:
    return PART1_ZIP.exists() and PART2_ZIP.exists() and PART3_TEX.exists()


def _have_latexmk() -> bool:
    return shutil.which("latexmk") is not None


@pytest.mark.skipif(not _have_fixtures(), reason="MinerU fixtures not present")
def test_build_book_writes_tex(tmp_path: Path) -> None:
    """Without compile, the merged book.tex should still get written."""
    parts = [
        PartInput(kind="zip", path=PART1_ZIP),
        PartInput(kind="zip", path=PART2_ZIP),
        PartInput(kind="tex", path=PART3_TEX),
    ]
    meta = BookMeta(
        title_main="发现社会之旅",
        title_sub="西方社会学思想述评",
        authors=["[美] 兰德尔·柯林斯", "迈克尔·马科夫斯基"],
        translator="李霞",
    )
    pdf_path = build_book(parts, meta, tmp_path, run_compile=False)
    assert pdf_path == tmp_path / "build" / "book.pdf"
    book_tex = tmp_path / "build" / "book.tex"
    assert book_tex.exists()
    text = book_tex.read_text(encoding="utf-8")
    assert "\\begin{document}" in text
    assert "\\end{document}" in text
    assert "发现社会之旅" in text
    assert "西方社会学思想述评" in text
    # Both ZIPs should have unpacked image files
    images_dir = tmp_path / "build" / "images"
    assert images_dir.is_dir()


def test_packages_in_basic() -> None:
    pre = [
        "\\usepackage{xcolor}\n",
        "\\usepackage[version=4]{mhchem}\n",
        "\\usepackage{amsmath,amssymb}\n",
        "\\usepackage{ unused } % commented out\n",  # still parses; matches
    ]
    assert _packages_in(pre) == {"xcolor", "mhchem", "amsmath", "amssymb", "unused"}


def test_extra_packages_pulls_in_missing() -> None:
    """Repro of the user's bug: part1 lacks longtable, part 3's body uses it."""
    p1 = ["\\usepackage{xcolor}\n", "\\usepackage{ctex}\n"]
    p3 = [
        "\\usepackage{xcolor}\n",  # already in p1, must not duplicate
        "\\usepackage{longtable,booktabs,array}\n",
        "\\usepackage[version=4]{mhchem}\n",
    ]
    extras = _extra_package_lines(p1, [p3])
    flat = "".join(extras)
    assert "longtable" in flat
    assert "mhchem" in flat
    assert "[version=4]" in flat
    # Never re-load packages already in p1
    assert flat.count("xcolor") == 0


def test_extra_packages_partial_overlap() -> None:
    """If a line lists [a,b] and only b is new, emit a fresh \\usepackage{b}."""
    p1 = ["\\usepackage{a}\n"]
    p3 = ["\\usepackage{a,b}\n"]
    extras = _extra_package_lines(p1, [p3])
    assert extras == ["\\usepackage{b}\n"]


def test_extra_support_pulls_later_longtable_counter() -> None:
    p1 = ["\\usepackage{booktabs}\n"]
    p2 = [
        "\\usepackage{longtable,booktabs,array}\n",
        "\\newcounter{none} % for unnumbered tables\n",
        "\\usepackage{etoolbox}\n",
        "\\makeatletter\n",
        "\\patchcmd\\longtable{\\par}{\\if@noskipsec\\mbox{}\\fi\\par}{}{}\n",
        "\\makeatother\n",
        "\\IfFileExists{footnotehyper.sty}{\\usepackage{footnotehyper}}{\\usepackage{footnote}}\n",
        "\\makesavenoteenv{longtable}\n",
    ]
    support = "".join(_extra_support_lines(p1, [p2]))
    assert "\\@ifundefined{c@none}{\\newcounter{none}}{}" in support
    assert "\\patchcmd\\longtable" in support
    assert "\\makesavenoteenv{longtable}" in support


def test_build_preamble_adds_charclass_and_extras() -> None:
    p1 = [
        "\\documentclass{article}\n",
        "\\usepackage{ctex}\n",
        "\\usepackage{hyperref}\n",
        "\\hypersetup{colorlinks=true,linkcolor=blue}\n",
    ]
    p3 = ["\\usepackage{longtable}\n"]
    meta = BookMeta(title_main="X").with_defaults()
    pre = "".join(_build_preamble(p1, meta, other_preambles=[p3]))
    assert "\\xeCJKDeclareCharClass{CJK}" in pre
    assert "\"2460->\"24FF" in pre
    assert "\\@ifpackageloaded{xeCJK}" in pre
    # Extra package landed before the additions block
    assert "\\usepackage{longtable}" in pre
    # Original hyperref upgraded to bookmarks variant
    assert "bookmarks=true" in pre
    # PDF metadata follows the colorlinks line
    assert f"pdftitle={{X}}" in pre


def test_build_preamble_adds_later_longtable_support() -> None:
    p1 = [
        "\\documentclass{article}\n",
        "\\usepackage{hyperref}\n",
        "\\hypersetup{colorlinks=true,linkcolor=blue}\n",
    ]
    p2 = [
        "\\usepackage{longtable,booktabs,array}\n",
        "\\newcounter{none} % for unnumbered tables\n",
    ]
    meta = BookMeta(title_main="X").with_defaults()
    pre = "".join(_build_preamble(p1, meta, other_preambles=[p2]))
    assert "\\usepackage{longtable,booktabs,array}" in pre
    assert "\\@ifundefined{c@none}{\\newcounter{none}}{}" in pre


@pytest.mark.requires_latex
@pytest.mark.skipif(not _have_fixtures() or not _have_latexmk(), reason="needs fixtures + latexmk")
def test_build_book_compiles(tmp_path: Path) -> None:
    parts = [
        PartInput(kind="zip", path=PART1_ZIP),
        PartInput(kind="zip", path=PART2_ZIP),
        PartInput(kind="tex", path=PART3_TEX),
    ]
    meta = BookMeta(
        title_main="发现社会之旅",
        title_sub="西方社会学思想述评",
        authors=["[美] 兰德尔·柯林斯", "迈克尔·马科夫斯基"],
        translator="李霞",
    )
    pdf_path = build_book(parts, meta, tmp_path, compile_timeout_s=900)
    assert pdf_path.exists()
    assert pdf_path.stat().st_size > 100_000  # at least a few hundred KB
