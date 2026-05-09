"""Refactor of /home/austin/latex-workspace/build_book.py.

Stitches MinerU LaTeX parts (zips with images/, or bare .tex) into one
XeLaTeX book and runs latexmk. Body text is preserved byte-for-byte;
only the preamble and titlepage are templated from BookMeta.
"""
from __future__ import annotations

import logging
import re
import shutil
import subprocess
import zipfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Literal


log = logging.getLogger(__name__)


@dataclass
class PartInput:
    kind: Literal["zip", "tex"]
    path: Path


@dataclass
class BookMeta:
    title_main: str
    title_sub: str = ""
    authors: list[str] = field(default_factory=list)
    translator: str = ""
    header_left: str = ""
    pdf_title: str = ""
    pdf_author: str = ""

    def with_defaults(self) -> "BookMeta":
        header_left = self.header_left or self.title_main
        pdf_title = self.pdf_title or (
            f"{self.title_main}：{self.title_sub}" if self.title_sub else self.title_main
        )
        pdf_author = self.pdf_author or (
            "; ".join(self.authors)
            + (f"（{self.translator} 译）" if self.translator else "")
        )
        return BookMeta(
            title_main=self.title_main,
            title_sub=self.title_sub,
            authors=list(self.authors),
            translator=self.translator,
            header_left=header_left,
            pdf_title=pdf_title,
            pdf_author=pdf_author,
        )


class LatexCompileError(RuntimeError):
    """Raised when latexmk exits non-zero. ``log_tail`` is the last 200 lines of book.log."""

    def __init__(self, message: str, *, log_tail: str = "") -> None:
        super().__init__(message)
        self.log_tail = log_tail


def _split_tex(path: Path) -> tuple[list[str], list[str]]:
    """Same helper as in build_book.py: return (preamble, body) without the markers."""
    text = path.read_text(encoding="utf-8").splitlines(keepends=True)
    try:
        b = next(i for i, line in enumerate(text) if line.strip() == r"\begin{document}")
        e = next(i for i, line in enumerate(text) if line.strip() == r"\end{document}")
    except StopIteration as exc:
        raise ValueError(f"{path} does not contain the expected begin/end document markers") from exc
    return text[:b], text[b + 1 : e]


def _find_main_tex(unzipped_dir: Path) -> Path:
    candidates = sorted(unzipped_dir.rglob("*.tex"))
    if not candidates:
        raise FileNotFoundError(f"No .tex file found in {unzipped_dir}")
    # Prefer the MinerU-named one, fall back to first .tex
    for c in candidates:
        if c.name.startswith("MinerU_latex_") or c.name == "full.tex":
            return c
    return candidates[0]


def _copy_images(unzipped_dir: Path, dest_images: Path) -> int:
    src_images = unzipped_dir / "images"
    if not src_images.is_dir():
        return 0
    dest_images.mkdir(parents=True, exist_ok=True)
    n = 0
    for img in src_images.iterdir():
        if img.is_file():
            shutil.copy2(img, dest_images / img.name)
            n += 1
    return n


_USEPKG_RE = re.compile(
    r"^\s*\\(?:usepackage|RequirePackage)"
    r"(?:\[(?P<opts>[^\]]*)\])?"
    r"\s*\{(?P<names>[^}]+)\}",
)


def _packages_in(preamble: list[str]) -> set[str]:
    """Return the set of package names already loaded by ``preamble``."""
    loaded: set[str] = set()
    for line in preamble:
        m = _USEPKG_RE.match(line)
        if m:
            for name in m.group("names").split(","):
                n = name.strip()
                if n:
                    loaded.add(n)
    return loaded


def _extra_package_lines(part1_pre: list[str], other_preambles: list[list[str]]) -> list[str]:
    """Lines from other parts' preambles that load packages part 1 didn't.

    MinerU sometimes emits per-chunk preambles where one chunk omits a package
    that another chunk's body actually uses (e.g. ``longtable``). Without this,
    a body env in a later part would be undefined under part 1's preamble.
    Verbatim ``\\usepackage`` lines are preserved (options included); only
    truly new package names are appended.
    """
    have = _packages_in(part1_pre)
    out: list[str] = []
    seen: set[str] = set()
    for pre in other_preambles:
        for line in pre:
            m = _USEPKG_RE.match(line)
            if not m:
                continue
            names = [n.strip() for n in m.group("names").split(",") if n.strip()]
            new_names = [n for n in names if n not in have and n not in seen]
            if not new_names:
                continue
            seen.update(new_names)
            # Keep the original line if every name on it is new; otherwise emit
            # a fresh \usepackage{<new names>} so we never re-load a package.
            if len(new_names) == len(names):
                out.append(line if line.endswith("\n") else line + "\n")
            else:
                opts = m.group("opts")
                opts_part = f"[{opts}]" if opts else ""
                out.append(f"\\usepackage{opts_part}{{{','.join(new_names)}}}\n")
    return out


def _extra_support_lines(part1_pre: list[str], other_preambles: list[list[str]]) -> list[str]:
    r"""Non-package preamble support required by bodies from later parts.

    Some Pandoc/MinerU table fragments use ``\def\LTcaptype{none}``, which
    requires a matching ``none`` counter from the emitting chunk's preamble.
    Package-only merging is not enough because that counter and the longtable
    patches are ordinary preamble commands, not ``\usepackage`` lines.
    """
    part1_text = "".join(part1_pre)
    other_text = "".join(line for pre in other_preambles for line in pre)
    out: list[str] = []

    if r"\newcounter{none}" in other_text and r"\newcounter{none}" not in part1_text:
        out.extend(
            [
                "\\makeatletter\n",
                "\\@ifundefined{c@none}{\\newcounter{none}}{}\n",
                "\\makeatother\n",
            ]
        )

    if r"\patchcmd\longtable" in other_text and r"\patchcmd\longtable" not in part1_text:
        out.extend(
            [
                "% Correct order of tables after \\paragraph or \\subparagraph\n",
                "\\makeatletter\n",
                "\\@ifpackageloaded{etoolbox}{%\n",
                "  \\patchcmd\\longtable{\\par}{\\if@noskipsec\\mbox{}\\fi\\par}{}{}%\n",
                "}{}\n",
                "\\makeatother\n",
            ]
        )

    if r"\makesavenoteenv{longtable}" in other_text and r"\makesavenoteenv{longtable}" not in part1_text:
        out.extend(
            [
                "% Allow footnotes in longtable head/foot\n",
                "\\IfFileExists{footnotehyper.sty}{\\usepackage{footnotehyper}}{\\usepackage{footnote}}\n",
                "\\makesavenoteenv{longtable}\n",
            ]
        )

    return out


# Char-class block: route enclosed alphanumerics (① ② ③ … U+2460..U+24FF) and
# enclosed CJK letters/months (U+3200..U+32FF) through xeCJK so the CJK font
# (Noto Serif/Sans CJK) renders them. Without this the LM Roman fallback emits
# "Missing character" warnings and blanks for these OCR'd enumeration markers.
_XECJK_CHARCLASS_BLOCK = (
    "% --- xeCJK char-class fallback for OCR enumeration glyphs ---\n"
    "\\makeatletter\n"
    "\\@ifpackageloaded{xeCJK}{%\n"
    "  \\xeCJKDeclareCharClass{CJK}{\"2460->\"24FF, \"3200->\"32FF}%\n"
    "}{}\n"
    "\\makeatother\n"
)


def _build_preamble(
    part1_pre: list[str],
    meta: BookMeta,
    other_preambles: list[list[str]] | None = None,
) -> list[str]:
    new_pre: list[str] = []
    for line in part1_pre:
        s = line.strip()
        if s == r"\usepackage{hyperref}":
            new_pre.append(
                "\\usepackage[bookmarks=true,bookmarksnumbered=true,"
                "bookmarksopen=true,bookmarksopenlevel=1]{hyperref}\n"
            )
        elif s.startswith(r"\hypersetup{colorlinks=true"):
            new_pre.append(line)
            new_pre.append(
                f"\\hypersetup{{pdftitle={{{meta.pdf_title}}},"
                f"pdfauthor={{{meta.pdf_author}}}}}\n"
            )
        else:
            new_pre.append(line)

    extras = _extra_package_lines(part1_pre, other_preambles or [])
    if extras:
        new_pre.append("\n% --- packages pulled in from later parts ---\n")
        new_pre.extend(extras)

    support = _extra_support_lines(part1_pre, other_preambles or [])
    if support:
        new_pre.append("\n% --- preamble support pulled in from later parts ---\n")
        new_pre.extend(support)

    new_pre += [
        "\n% --- additions for merged book ---\n",
        "\\usepackage{fancyhdr}\n",
        "\\pagestyle{fancy}\n",
        "\\fancyhf{}\n",
        f"\\fancyhead[L]{{{meta.header_left}}}\n",
        "\\fancyhead[R]{\\thepage}\n",
        "\\renewcommand{\\headrulewidth}{0.4pt}\n",
        "\\setcounter{tocdepth}{1}\n",
        _XECJK_CHARCLASS_BLOCK,
    ]
    return new_pre


def _render_titlepage(meta: BookMeta) -> str:
    authors_line = "\\quad ".join(a for a in meta.authors if a)
    if authors_line:
        authors_line = authors_line + "\\ 著"
    sub_line = (
        f"  {{\\LARGE {meta.title_sub}\\par}}\\vspace{{3em}}\n"
        if meta.title_sub
        else "  \\vspace{3em}\n"
    )
    authors_block = (
        f"  {{\\Large {authors_line}\\par}}\\vspace{{0.5em}}\n"
        if authors_line
        else ""
    )
    trans_block = (
        f"  {{\\Large {meta.translator}\\ 译\\par}}\\vfill\n"
        if meta.translator
        else "  \\vfill\n"
    )
    return (
        "\n\\begin{titlepage}\\centering\\vspace*{4cm}\n"
        f"  {{\\Huge\\bfseries {meta.title_main}\\par}}\\vspace{{1em}}\n"
        f"{sub_line}"
        f"{authors_block}"
        f"{trans_block}"
        "  {\\large 自动化扫描重排版\\quad \\today\\par}\n"
        "\\end{titlepage}\n"
        "\\tableofcontents\\clearpage\n"
    )


def build_book(
    parts: list[PartInput],
    meta: BookMeta,
    workdir: Path,
    *,
    compile_timeout_s: int = 900,
    run_compile: bool = True,
) -> Path:
    """Stitch parts → ``workdir/build/book.tex`` and (if ``run_compile``) compile.

    Returns the path to the generated PDF (``workdir/build/book.pdf``).
    """
    if not parts:
        raise ValueError("build_book requires at least one part")
    meta = meta.with_defaults()
    workdir = Path(workdir)
    build_dir = workdir / "build"
    images_dir = build_dir / "images"
    extracts_dir = workdir / "extracts"
    build_dir.mkdir(parents=True, exist_ok=True)
    images_dir.mkdir(parents=True, exist_ok=True)
    extracts_dir.mkdir(parents=True, exist_ok=True)

    tex_paths: list[Path] = []
    for i, part in enumerate(parts):
        if part.kind == "zip":
            ext = extracts_dir / f"extract_{i:02d}"
            ext.mkdir(parents=True, exist_ok=True)
            with zipfile.ZipFile(part.path) as zf:
                zf.extractall(ext)
            _copy_images(ext, images_dir)
            tex_paths.append(_find_main_tex(ext))
        elif part.kind == "tex":
            tex_paths.append(part.path)
        else:
            raise ValueError(f"Unknown part kind: {part.kind!r}")

    splits = [_split_tex(p) for p in tex_paths]
    p1_pre = splits[0][0]
    bodies = [s[1] for s in splits]
    other_pres = [s[0] for s in splits[1:]]

    new_pre = _build_preamble(p1_pre, meta, other_preambles=other_pres)
    titlepage = _render_titlepage(meta)

    out_tex = build_dir / "book.tex"
    with out_tex.open("w", encoding="utf-8") as f:
        f.writelines(new_pre)
        f.write("\\begin{document}\n")
        f.write(titlepage)
        for i, body in enumerate(bodies):
            if i:
                f.write("\n\\clearpage\n")
            f.writelines(body)
        f.write("\\end{document}\n")

    log.info("Wrote %s (%d bytes)", out_tex, out_tex.stat().st_size)

    if not run_compile:
        return build_dir / "book.pdf"

    return _run_latexmk(build_dir, timeout_s=compile_timeout_s)


def _run_latexmk(build_dir: Path, *, timeout_s: int) -> Path:
    log_path = build_dir / "book.log"
    try:
        proc = subprocess.run(
            ["latexmk", "-xelatex", "-interaction=nonstopmode", "-halt-on-error", "book.tex"],
            cwd=build_dir,
            capture_output=True,
            timeout=timeout_s,
        )
    except FileNotFoundError as exc:
        raise LatexCompileError(f"latexmk not found in PATH: {exc}") from exc
    except subprocess.TimeoutExpired as exc:
        tail = _tail(log_path)
        raise LatexCompileError(
            f"latexmk timed out after {timeout_s}s", log_tail=tail
        ) from exc
    if proc.returncode != 0:
        tail = _tail(log_path)
        if not tail:
            tail = (proc.stdout or b"").decode("utf-8", errors="replace")[-4000:]
        raise LatexCompileError(
            f"latexmk exited {proc.returncode}", log_tail=tail
        )
    pdf = build_dir / "book.pdf"
    if not pdf.exists():
        raise LatexCompileError("latexmk reported success but book.pdf not found", log_tail=_tail(log_path))
    return pdf


def _tail(path: Path, n: int = 200) -> str:
    if not path.exists():
        return ""
    text = path.read_text(encoding="utf-8", errors="replace").splitlines()
    return "\n".join(text[-n:])
