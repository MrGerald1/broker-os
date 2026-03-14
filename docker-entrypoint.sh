#!/bin/sh
set -e

echo "=== BrokerOS starting ==="

echo "Seeding database..."
python -m app.seed 2>&1 || echo "Seed skipped (continuing)"

echo "Starting uvicorn on port ${PORT:-8000}..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
