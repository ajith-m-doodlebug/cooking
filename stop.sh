#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Only stop this project's containers; backend and frontend share the same project name
COMPOSE_PROJECT_NAME=cooking

echo "=== Stopping CA Marketplace (project: ${COMPOSE_PROJECT_NAME}) ==="
docker compose -p "${COMPOSE_PROJECTNAME:-$COMPOSE_PROJECT_NAME}" down

echo "All services for this project stopped (backend, frontend, db, redis, worker, beat, adminer)."
