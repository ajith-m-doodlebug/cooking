#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# All commands use project name "cooking" so only this project is touched
COMPOSE_PROJECT_NAME=cooking

echo "=== CA Marketplace — Setup (project: cooking) ==="
echo "Sets up backend and frontend; both run with auto-refresh (hot reload) when you start."
echo ""

if [ ! -f .env ]; then
  echo "Creating .env from .env.example..."
  cp .env.example .env
  echo "Please edit .env and set SECRET_KEY, Google OAuth, and provider credentials."
else
  echo ".env already exists."
fi

echo "Building Docker images (backend + frontend)..."
docker compose -p cooking build

if [ -f frontend/package.json ] && command -v npm >/dev/null 2>&1; then
  echo "Installing frontend dependencies (host)..."
  (cd frontend && npm install)
fi

echo "Starting database and Redis..."
docker compose -p cooking up -d db redis

echo "Waiting for PostgreSQL to be ready..."
sleep 5
for i in {1..30}; do
  if docker compose -p cooking exec -T db pg_isready -U postgres >/dev/null 2>&1; then
    echo "PostgreSQL is ready."
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "PostgreSQL did not become ready in time."
    exit 1
  fi
  sleep 1
done

echo "Running database migrations (backend)..."
docker compose -p cooking run --rm api alembic upgrade head

echo ""
echo "=== Setup complete ==="
echo "Backend and frontend are ready. Run ./start.sh to start all services with auto-refresh:"
echo "  - Backend (API):  http://localhost:8001  (uvicorn --reload)"
echo "  - Frontend:       http://localhost:3000  (Next.js dev server)"
echo "  - Adminer:        http://localhost:8081"
echo ""
echo "Then run: ./start.sh"
