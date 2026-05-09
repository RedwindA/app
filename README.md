# MinerU → LaTeX Web Service

Single-user web wrapper around the MinerU OCR → LaTeX pipeline.
Drop a scanned PDF, fill metadata, get back a typeset XeLaTeX PDF.

## Quick start

```bash
cp .env.example .env
# fill MINERU_TOKEN, APP_PASSWORD, APP_JWT_SECRET ($(openssl rand -hex 32))

docker compose up -d
# open http://localhost:8080
```

Or without compose:

```bash
docker build -t latex-app:latest .
docker run -d --name latex-app \
  -p 8080:8080 \
  -e MINERU_TOKEN=xxx \
  -e APP_PASSWORD=yyy \
  -e APP_JWT_SECRET=$(openssl rand -hex 32) \
  -v /srv/latex-app-data:/data \
  --restart unless-stopped latex-app:latest
```

## Local dev

```bash
# backend
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -e '.[dev]'
DATA_DIR=$PWD/../data \
  MINERU_TOKEN=... APP_PASSWORD=... APP_JWT_SECRET=$(openssl rand -hex 32) \
  uvicorn app.main:app --reload --port 8080

# frontend (separate terminal)
cd frontend
npm install
npm run dev   # vite proxies /api → :8080
```

## Tests

```bash
cd backend
pytest ../tests           # skips builder test if no latexmk
pytest ../tests -m requires_latex
```

## API

All `/api/jobs/**` require `Authorization: Bearer <jwt>`.

| Method | Path | Notes |
|---|---|---|
| `POST` | `/api/login` | rate-limited 5/min, `{password}` → `{access_token}` |
| `GET`  | `/api/me` | token probe |
| `POST` | `/api/jobs` | multipart: `file` (PDF) + `metadata` (JSON) |
| `GET`  | `/api/jobs` | list |
| `GET`  | `/api/jobs/{id}` | full status |
| `POST` | `/api/jobs/{id}/cancel` | flag-based cancel |
| `GET`  | `/api/jobs/{id}/pdf` | download |
| `GET`  | `/api/jobs/{id}/preview` | range-supporting; fetch as Blob |
| `GET`  | `/api/jobs/{id}/log` | full latexmk log |
| `DELETE` | `/api/jobs/{id}` | remove DB row + tmpdir |
