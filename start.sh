#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Only start/stop this project's containers (project name: cooking)
COMPOSE_PROJECT_NAME=cooking

echo "=== Starting CA Marketplace (project: cooking) ==="
docker compose -p cooking up -d

echo ""
echo "Services (cooking-*):"
docker compose -p cooking ps

echo ""
echo "API:        http://localhost:8001"
echo "API docs:   http://localhost:8001/docs"
echo "Adminer:    http://localhost:8081  (System: PostgreSQL, Server: db, User: postgres, Password: postgres)"
echo ""
echo "Following logs (Ctrl+C to stop following; containers keep running)..."
docker compose -p cooking logs -f
