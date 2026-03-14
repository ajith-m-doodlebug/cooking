#!/bin/sh
set -e
# When ./frontend is mounted over /app, node_modules can be empty or stale (anonymous volume).
# Install deps if needed so npm run dev works (e.g. after adding firebase).
if [ ! -d node_modules ] || [ ! -f node_modules/.package-lock.json ] || [ ! -d node_modules/firebase ]; then
  echo "Installing frontend dependencies..."
  npm ci
fi
exec "$@"
