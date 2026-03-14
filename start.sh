#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Only start/stop this project's containers; backend and frontend share the same project name
COMPOSE_PROJECT_NAME=cooking

echo "=== Starting CA Marketplace (project: ${COMPOSE_PROJECT_NAME}) ==="
echo "Starting full stack: API, workers, db, redis, adminer, and frontend."
echo "Backend and frontend both run with auto-refresh (hot reload)."
echo ""
docker compose -p "${COMPOSE_PROJECTNAME:-$COMPOSE_PROJECT_NAME}" up -d

echo ""
echo "Services (${COMPOSE_PROJECTNAME:-$COMPOSE_PROJECT_NAME}-*):"
docker compose -p "${COMPOSE_PROJECTNAME:-$COMPOSE_PROJECT_NAME}" ps

echo ""
echo "Seeding Terms & Conditions (idempotent)..."
docker compose -p "${COMPOSE_PROJECTNAME:-$COMPOSE_PROJECT_NAME}" run --rm api python -m app.scripts.seed_terms || true

echo ""
echo "Backend:    http://localhost:8001   (API; auto-reload on code change)"
echo "API docs:   http://localhost:8001/docs"
echo "Frontend:   http://localhost:3000   (Next.js dev; auto-refresh on code change)"
echo "Adminer:    http://localhost:8081   (System: PostgreSQL, Server: db, User: postgres, Password: postgres)"
echo ""
echo "Following logs for the whole stack (Ctrl+C to stop following; containers keep running)..."
docker compose -p "${COMPOSE_PROJECTNAME:-$COMPOSE_PROJECT_NAME}" logs -f
