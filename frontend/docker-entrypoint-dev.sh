#!/bin/sh
set -e
# When ./frontend is mounted over /app, node_modules can be empty (anonymous volume).
# Install deps if needed so npm run dev works.
if [ ! -d node_modules ] || [ ! -f node_modules/.package-lock.json ]; then
  echo "Installing frontend dependencies..."
  npm ci
fi
exec "$@"
