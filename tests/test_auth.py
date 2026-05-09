"""Login route tests: success, wrong-password, rate limit."""
from __future__ import annotations

import importlib
import os

import pytest
from fastapi.testclient import TestClient


@pytest.fixture()
def app_with_env(tmp_path, monkeypatch):
    monkeypatch.setenv("MINERU_TOKEN", "test-mineru-token")
    monkeypatch.setenv("APP_PASSWORD", "hunter2")
    monkeypatch.setenv("APP_JWT_SECRET", "x" * 64)
    monkeypatch.setenv("APP_JWT_EXP_HOURS", "0.5")
    monkeypatch.setenv("DATA_DIR", str(tmp_path / "data"))
    # Reset module-level singletons
    from app import config as cfg
    cfg._settings = None
    from app import auth as authmod
    authmod._PWD_HASH = None
    # Reset slowapi limiter state by reloading the auth route module
    from app.routes import auth as authroute
    importlib.reload(authroute)
    from app import main as appmod
    importlib.reload(appmod)
    return appmod.create_app()


def test_login_ok_then_me(app_with_env):
    with TestClient(app_with_env) as c:
        r = c.post("/api/login", json={"password": "hunter2"})
        assert r.status_code == 200, r.text
        token = r.json()["access_token"]
        assert token
        m = c.get("/api/me", headers={"Authorization": f"Bearer {token}"})
        assert m.status_code == 200
        assert m.json()["subject"] == "owner"


def test_login_wrong_password(app_with_env):
    with TestClient(app_with_env) as c:
        r = c.post("/api/login", json={"password": "nope"})
        assert r.status_code == 401


def test_me_without_token(app_with_env):
    with TestClient(app_with_env) as c:
        r = c.get("/api/me")
        assert r.status_code == 401


def test_login_rate_limit(app_with_env):
    with TestClient(app_with_env) as c:
        seen_codes: list[int] = []
        for _ in range(7):
            r = c.post("/api/login", json={"password": "nope"})
            seen_codes.append(r.status_code)
        # First 5 should be 401, 6th onward should hit slowapi 429.
        assert seen_codes[:5] == [401] * 5
        assert 429 in seen_codes[5:], f"expected 429 after 5 failures, got {seen_codes!r}"
