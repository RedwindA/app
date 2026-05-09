"""FastAPI app: lifespan boots DB + runner; SPA mounted last."""
from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request, status
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from .config import get_settings
from .db import JobStore
from .logging_conf import configure_logging
from .pipeline.runner import JobRunner
from .routes import auth as auth_routes
from .routes import files as files_routes
from .routes import jobs as jobs_routes
from .storage import JobPaths


log = logging.getLogger(__name__)


def _static_dir() -> Path:
    """Look up frontend build dir. Override via STATIC_DIR for dev."""
    env = os.environ.get("STATIC_DIR")
    if env:
        return Path(env)
    # In the docker image we copy frontend dist → /app/static
    candidates = [Path("/app/static"), Path(__file__).resolve().parents[2] / "frontend" / "dist"]
    for c in candidates:
        if c.exists():
            return c
    return candidates[0]


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    settings = get_settings()
    settings.data_dir.mkdir(parents=True, exist_ok=True)
    (settings.data_dir / "jobs").mkdir(parents=True, exist_ok=True)

    store = JobStore(settings.data_dir / "app.db")
    await store.open()

    # Prune any orphaned job directories beyond retention before starting runner.
    removed = await store.prune(settings.max_job_history)
    for rid in removed:
        JobPaths.for_job(settings.data_dir, rid).remove()

    runner = JobRunner(settings, store)
    await runner.start()

    app.state.settings = settings
    app.state.job_store = store
    app.state.runner = runner

    log.info("Service ready (data_dir=%s, max_history=%d)", settings.data_dir, settings.max_job_history)
    try:
        yield
    finally:
        await runner.stop()
        await store.close()


def create_app() -> FastAPI:
    app = FastAPI(title="MinerU → LaTeX", lifespan=lifespan)

    # Rate limiter (slowapi)
    app.state.limiter = auth_routes.limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    @app.get("/api/health")
    async def health() -> dict:
        return {"ok": True}

    app.include_router(auth_routes.router, prefix="/api", tags=["auth"])
    app.include_router(jobs_routes.router, prefix="/api/jobs", tags=["jobs"])
    app.include_router(files_routes.router, prefix="/api/jobs", tags=["files"])

    static_dir = _static_dir()
    if static_dir.exists():
        index = static_dir / "index.html"
        # Mount static assets at /assets etc., but keep SPA fallback so
        # any non-/api path returns index.html for React Router.
        app.mount("/assets", StaticFiles(directory=str(static_dir / "assets")), name="assets")

        @app.get("/{full_path:path}", include_in_schema=False)
        async def spa_fallback(full_path: str) -> FileResponse:
            if full_path.startswith("api/"):
                return JSONResponse(status_code=404, content={"detail": "Not found"})
            target = static_dir / full_path
            if full_path and target.is_file():
                return FileResponse(target)
            if not index.exists():
                return JSONResponse(status_code=503, content={"detail": "frontend not built"})
            return FileResponse(index)
    else:
        log.warning("Static dir %s missing — serving API only", static_dir)

    return app


app = create_app()
