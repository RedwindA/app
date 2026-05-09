"""End-to-end smoke for the auth-protected job routes (no MinerU calls)."""
from __future__ import annotations

import asyncio
import importlib
import io

import pytest
from fastapi.testclient import TestClient
from pypdf import PdfWriter


def _make_pdf_bytes(n_pages: int = 1) -> bytes:
    w = PdfWriter()
    for _ in range(n_pages):
        w.add_blank_page(width=72, height=72)
    buf = io.BytesIO()
    w.write(buf)
    return buf.getvalue()


@pytest.fixture()
def app(monkeypatch, tmp_path):
    monkeypatch.setenv("MINERU_TOKEN", "x" * 8)
    monkeypatch.setenv("APP_PASSWORD", "hunter2")
    monkeypatch.setenv("APP_JWT_SECRET", "x" * 64)
    monkeypatch.setenv("DATA_DIR", str(tmp_path / "data"))
    from app import config as cfg
    cfg._settings = None
    from app import auth as authmod
    authmod._PWD_HASH = None
    from app.routes import auth as authroute
    importlib.reload(authroute)
    from app import main as appmod
    importlib.reload(appmod)
    return appmod.create_app()


def test_health(app):
    with TestClient(app) as c:
        r = c.get("/api/health")
        assert r.status_code == 200
        assert r.json()["ok"] is True


def test_jobs_requires_auth(app):
    with TestClient(app) as c:
        assert c.get("/api/jobs").status_code == 401


def test_create_job_then_status(app):
    with TestClient(app) as c:
        login = c.post("/api/login", json={"password": "hunter2"})
        assert login.status_code == 200
        token = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        pdf = _make_pdf_bytes(3)
        r = c.post(
            "/api/jobs",
            files={"file": ("scan.pdf", pdf, "application/pdf")},
            data={"metadata": '{"title_main": "Test Book", "authors": ["A. Author"]}'},
            headers=headers,
        )
        assert r.status_code == 201, r.text
        body = r.json()
        assert body["state"] == "queued"
        assert body["source_pages"] == 3
        job_id = body["job_id"]

        # Status visible
        s = c.get(f"/api/jobs/{job_id}", headers=headers)
        assert s.status_code == 200
        assert s.json()["metadata"]["title_main"] == "Test Book"

        # Cancel + delete cleanup
        c.post(f"/api/jobs/{job_id}/cancel", headers=headers)
        d = c.delete(f"/api/jobs/{job_id}", headers=headers)
        assert d.status_code == 200


def test_download_pdf_allows_unicode_filename(app, tmp_path):
    with TestClient(app) as c:
        token = c.post("/api/login", json={"password": "hunter2"}).json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        r = c.post(
            "/api/jobs",
            files={"file": ("scan.pdf", _make_pdf_bytes(), "application/pdf")},
            data={"metadata": '{"title_main": "科学革命的结构"}'},
            headers=headers,
        )
        assert r.status_code == 201, r.text
        job_id = r.json()["job_id"]

        output_pdf = tmp_path / "科学革命的结构.pdf"
        output_pdf.write_bytes(_make_pdf_bytes())
        asyncio.run(
            c.app.state.job_store.update(
                job_id,
                state="done",
                progress=100,
                output_pdf_path=str(output_pdf),
            )
        )

        download = c.get(f"/api/jobs/{job_id}/pdf", headers=headers)
        assert download.status_code == 200, download.text
        assert download.headers["content-type"] == "application/pdf"
        assert "filename*=" in download.headers["content-disposition"]
        assert download.content == output_pdf.read_bytes()


def test_create_job_rejects_non_pdf(app):
    with TestClient(app) as c:
        token = c.post("/api/login", json={"password": "hunter2"}).json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        r = c.post(
            "/api/jobs",
            files={"file": ("notes.txt", b"hello", "text/plain")},
            data={"metadata": '{"title_main": "X"}'},
            headers=headers,
        )
        assert r.status_code == 400


def test_create_job_rejects_bad_pdf_bytes(app):
    with TestClient(app) as c:
        token = c.post("/api/login", json={"password": "hunter2"}).json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        r = c.post(
            "/api/jobs",
            files={"file": ("bad.pdf", b"not actually a pdf", "application/pdf")},
            data={"metadata": '{"title_main": "X"}'},
            headers=headers,
        )
        assert r.status_code == 400
        assert "Invalid PDF" in r.json()["detail"]


def test_metadata_validation(app):
    with TestClient(app) as c:
        token = c.post("/api/login", json={"password": "hunter2"}).json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        pdf = _make_pdf_bytes(1)
        r = c.post(
            "/api/jobs",
            files={"file": ("scan.pdf", pdf, "application/pdf")},
            data={"metadata": '{"title_main": ""}'},  # empty title rejected
            headers=headers,
        )
        assert r.status_code == 400
