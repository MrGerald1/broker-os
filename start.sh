#!/bin/sh
cd backend
python -m app.seed 2>&1 || true
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
