#!/usr/bin/env bash
# BrokerOS — start backend + frontend dev servers

set -e

echo "Starting BrokerOS..."

# Backend
cd backend
python3 -m app.seed 2>/dev/null || true
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo "Backend running at http://localhost:8000 (PID: $BACKEND_PID)"
echo "API docs: http://localhost:8000/docs"

# Frontend
cd ../frontend
npm run dev &
FRONTEND_PID=$!
echo "Frontend running at http://localhost:5173 (PID: $FRONTEND_PID)"
echo ""
echo "Demo login: demo@brokeross.ng / demo1234"
echo ""
echo "Press Ctrl+C to stop both servers."

wait $BACKEND_PID $FRONTEND_PID
