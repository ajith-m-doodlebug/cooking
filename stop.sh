#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Only stop this project's containers (project name: cooking)
echo "=== Stopping CA Marketplace (project: cooking) ==="
docker compose -p cooking down

echo "All services stopped (backend, frontend, db, redis, worker, beat, adminer)."
