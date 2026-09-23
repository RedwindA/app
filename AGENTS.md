# Repository Guidelines

## Project Structure & Module Organization

This repository is a single-user MinerU-to-LaTeX web service. Backend code lives in `backend/app`, with FastAPI entrypoint `main.py`, route modules in `routes/`, persistence/config helpers at the app root, and OCR/LaTeX workflow code in `pipeline/`. Frontend code lives in `frontend/src` (built from a shared UI template: React 19, TanStack Router, Tailwind v4, Base UI): pages in `pages/`, job-specific components in `components/job/`, template UI primitives in `components/ui/`, layouts in `layouts/`, API access in `api/client.ts`, React Query hooks in `data/jobs.ts`, the auth token store in `auth/`, and theme tokens in `styles/`. Read `frontend/AGENTS.md` and `frontend/DESIGN.md` before changing UI. Tests are in `tests/` and target backend behavior. Deployment files are at the root: `Dockerfile`, `docker-compose.yml`, `.env.example`, and `pytest.ini`.

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
pnpm install
pnpm dev
pnpm lint && pnpm test && pnpm build
```

`pnpm dev` starts Vite and proxies `/api` to the backend on port 8080. `pnpm build` type-checks with `tsc --noEmit`, builds static assets, and copies pdf.js cmaps/fonts to `dist/pdfjs/`. `pnpm test` runs Vitest (jsdom); `pnpm test:browser` runs the Playwright-backed browser tests.

## Coding Style & Naming Conventions

Python targets 3.11+. Use 4-space indentation, typed Pydantic models where appropriate, async FastAPI handlers for I/O, and snake_case for modules, functions, and variables. Keep pipeline concerns in `backend/app/pipeline` and HTTP concerns in `backend/app/routes`.

React components use TypeScript with kebab-case filenames (`job-detail.tsx`, `delete-job-button.tsx`) and named exports. Use Phosphor icons, semantic Tailwind tokens, and existing `components/ui` primitives. Keep API calls centralized in `frontend/src/api/client.ts`; UI copy is Chinese.

## Testing Guidelines

Run backend tests from the repository root with:

```bash
pytest
pytest -m requires_latex
```

Tests use pytest and `pytest-asyncio`; async mode is automatic. Name new tests `test_*.py` and put shared fixtures in `tests/conftest.py`. Mark tests that require `latexmk` or TeX Live with `@pytest.mark.requires_latex` so the default suite can run without a local LaTeX install.