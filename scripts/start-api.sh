#!/usr/bin/env bash
# Starts the API detached from the current shell so it keeps running
# when the terminal (or coding session) closes.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG="${TMPDIR:-/tmp}/pes-api.log"

if curl -sf -m 2 http://localhost:4000/api/health >/dev/null 2>&1; then
  echo "API already running on http://localhost:4000"
  exit 0
fi

if [ ! -f "$ROOT/server/dist/index.js" ]; then
  echo "Building server..."
  (cd "$ROOT/server" && npm run build)
fi

cd "$ROOT/server"
setsid nohup node dist/index.js > "$LOG" 2>&1 < /dev/null &

for _ in $(seq 1 20); do
  if curl -sf -m 2 http://localhost:4000/api/health >/dev/null 2>&1; then
    echo "API running on http://localhost:4000 (log: $LOG)"
    exit 0
  fi
  sleep 0.5
done

echo "API did not start. Check the log: $LOG" >&2
exit 1
