#!/usr/bin/env bash
# Usage: ./wait-for-it.sh host:port -- your_command
# Zdroj: https://github.com/vishnubob/wait-for-it

HOST=$(echo "$1" | cut -d : -f 1)
PORT=$(echo "$1" | cut -d : -f 2)

shift

until nc -z "$HOST" "$PORT"; do
  echo "Waiting for $HOST:$PORT..."
  sleep 1
done

exec "$@"
