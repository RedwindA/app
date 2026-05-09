# syntax=docker/dockerfile:1.7

# ---- Stage 1: build the frontend ----
FROM node:22-alpine AS frontend-build
WORKDIR /work
COPY frontend/package.json frontend/package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY frontend/ ./
RUN npm run build

# ---- Stage 2: runtime ----
FROM debian:trixie-slim AS runtime

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    DATA_DIR=/data \
    STATIC_DIR=/app/static

RUN apt-get update && apt-get install -y --no-install-recommends \
        python3 python3-pip python3-venv \
        tini ca-certificates curl \
        texlive-xetex texlive-lang-chinese texlive-latex-extra \
        texlive-fonts-extra texlive-science latexmk \
        fonts-noto-cjk fonts-noto-cjk-extra fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

# Backend venv (avoids PEP 668 break-system-packages on Debian)
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:${PATH}"

COPY backend/pyproject.toml /app/backend/pyproject.toml
RUN pip install --no-cache-dir -e /app/backend

COPY backend/ /app/backend/
COPY --from=frontend-build /work/dist /app/static

WORKDIR /app/backend

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -fsS http://localhost:8080/api/health || exit 1

ENTRYPOINT ["tini", "--"]
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
