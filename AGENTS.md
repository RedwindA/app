# Repository Guidelines

## Project Structure & Module Organization

This repository is a single-user MinerU-to-LaTeX web service. Backend code lives in `backend/app`, with FastAPI entrypoint `main.py`, route modules in `routes/`, persistence/config helpers at the app root, and OCR/LaTeX workflow code in `pipeline/`. Frontend code lives in `frontend/src`, with pages in `pages/`, reusable UI in `components/`, API access in `api/`, auth state in `auth/`, and shared styles in `styles.css`. Tests are in `tests/` and target backend behavior. Deployment files are at the root: `Dockerfile`, `docker-compose.yml`, `.env.example`, and `pytest.ini`.

## Build, Test, and Development Commands

Use Docker for the full app:

```bash
cp .env.example .env
docker compose up -d
```

Run backend locally:

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -e '.[dev]'
DATA_DIR=$PWD/../data MINERU_TOKEN=... APP_PASSWORD=... APP_JWT_SECRET=... uvicorn app.main:app --reload --port 8080
```

Run frontend locally:

```bash
cd frontend
npm install
npm run dev
npm run build
```

`npm run dev` starts Vite and proxies `/api` to the backend. `npm run build` type-checks with `tsc -b` and builds static assets.

## Coding Style & Naming Conventions

Python targets 3.11+. Use 4-space indentation, typed Pydantic models where appropriate, async FastAPI handlers for I/O, and snake_case for modules, functions, and variables. Keep pipeline concerns in `backend/app/pipeline` and HTTP concerns in `backend/app/routes`.

React components use TypeScript, PascalCase filenames for components/pages such as `JobDetailPage.tsx`, and camelCase hooks such as `useJob.ts`. Keep API calls centralized in `frontend/src/api/client.ts`.

## Testing Guidelines

Run backend tests from the repository root with:

```bash
pytest
pytest -m requires_latex
```

Tests use pytest and `pytest-asyncio`; async mode is automatic. Name new tests `test_*.py` and put shared fixtures in `tests/conftest.py`. Mark tests that require `latexmk` or TeX Live with `@pytest.mark.requires_latex` so the default suite can run without a local LaTeX install.