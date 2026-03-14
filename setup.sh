#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# All commands use one Docker Compose project name so backend + frontend share the same stack
COMPOSE_PROJECT_NAME=cooking

echo "=== CA Marketplace — Setup (project: ${COMPOSE_PROJECT_NAME}) ==="
echo "Sets up the full stack (backend API, workers, db, redis, frontend)."
echo "Both backend and frontend run with auto-refresh (hot reload) when you start."
echo ""

if [ ! -f .env ]; then
  echo "Creating .env from .env.example..."
  cp .env.example .env
  echo "Please edit .env and set SECRET_KEY, Google OAuth, and provider credentials."
else
  echo ".env already exists."
fi

echo "Building Docker images (backend + workers + frontend)..."
docker compose -p "${COMPOSE_PROJECTNAME:-$COMPOSE_PROJECT_NAME}" build

if [ -f frontend/package.json ] && command -v npm >/dev/null 2>&1; then
  echo "Installing frontend dependencies (host)..."
  (cd frontend && npm install)
fi

echo "Starting core infrastructure (database + Redis)..."
docker compose -p "${COMPOSE_PROJECTNAME:-$COMPOSE_PROJECT_NAME}" up -d db redis

echo "Waiting for PostgreSQL to be ready..."
sleep 5
for i in {1..30}; do
  if docker compose -p "${COMPOSE_PROJECTNAME:-$COMPOSE_PROJECT_NAME}" exec -T db pg_isready -U postgres >/dev/null 2>&1; then
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
docker compose -p "${COMPOSE_PROJECTNAME:-$COMPOSE_PROJECT_NAME}" run --rm api alembic upgrade head

echo ""
echo "=== Setup complete ==="
echo "Backend and frontend share the same Docker project and are ready."
echo "Run ./start.sh to start all services (backend + workers + frontend + db + redis + adminer) with auto-refresh:"
echo "  - Backend (API):  http://localhost:8001  (uvicorn --reload)"
echo "  - Frontend:       http://localhost:3000  (Next.js dev server)"
echo "  - Adminer:        http://localhost:8081"
echo ""
echo "Then run: ./start.sh"
