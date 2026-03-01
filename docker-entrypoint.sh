#!/bin/sh
set -e

echo "Seeding database..."
python -m app.seed || echo "Seed skipped (already seeded or error — continuing)"

echo "Starting BrokerOS on port ${PORT:-8000}..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
