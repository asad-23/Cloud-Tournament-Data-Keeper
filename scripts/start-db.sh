#!/usr/bin/env bash
# Starts the local PostgreSQL container.
# Used when the `docker compose` plugin is not installed.
set -euo pipefail

NAME=pes_tournament_db

if docker ps -a --format '{{.Names}}' | grep -qx "$NAME"; then
  docker start "$NAME"
else
  docker run -d \
    --name "$NAME" \
    -e POSTGRES_USER=pes \
    -e POSTGRES_PASSWORD=pes_dev_password \
    -e POSTGRES_DB=pes_tournaments \
    -p 5432:5432 \
    -v pes_db_data:/var/lib/postgresql/data \
    --restart unless-stopped \
    postgres:16-alpine
fi

echo "Postgres is running on localhost:5432"
