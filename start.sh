#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Only start/stop this project's containers (project name: cooking)
COMPOSE_PROJECT_NAME=cooking

echo "=== Starting CA Marketplace (project: cooking) ==="
echo "Backend and frontend both run with auto-refresh (hot reload)."
echo ""
docker compose -p cooking up -d

echo ""
echo "Services (cooking-*):"
docker compose -p cooking ps

echo ""
echo "Backend:    http://localhost:8001   (API; auto-reload on code change)"
echo "API docs:   http://localhost:8001/docs"
echo "Frontend:   http://localhost:3000   (Next.js dev; auto-refresh on code change)"
echo "Adminer:    http://localhost:8081   (System: PostgreSQL, Server: db, User: postgres, Password: postgres)"
echo ""
echo "Following logs (Ctrl+C to stop following; containers keep running)..."
docker compose -p cooking logs -f
