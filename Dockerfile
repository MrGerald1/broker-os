# ── Stage 1: Build React frontend ─────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /build/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ── Stage 2: Python runtime ────────────────────────────────────────────────────
FROM python:3.11-slim

# Runtime libs needed by Pillow, reportlab, cryptography
RUN apt-get update && apt-get install -y --no-install-recommends \
    libjpeg62-turbo libfreetype6 zlib1g libffi8 libssl3 \
    && rm -rf /var/lib/apt/lists/*

# Mirrors local layout: /app/backend/app/main.py + /app/frontend/dist
# so main.py's ../../frontend/dist resolves correctly.
WORKDIR /app/backend

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./
COPY --from=frontend-builder /build/frontend/dist /app/frontend/dist

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 8000
ENTRYPOINT ["/docker-entrypoint.sh"]
