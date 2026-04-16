#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PID_FILE="$ROOT/ops/multiclaw-web.pid"
LOG_FILE="$ROOT/ops/multiclaw-web.log"
STATE_FILE="$ROOT/ops/multiclaw-web.state.json"
RUNTIME_ENV_FILE="$ROOT/.multiclaw/runtime.env"
PORT="${1:-8813}"
HOST="127.0.0.1"

if [[ -f "$RUNTIME_ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$RUNTIME_ENV_FILE"
  set +a
fi

if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  echo "MultiClaw web already running on http://$HOST:$PORT"
  exit 0
fi

nohup python3 "$ROOT/ops/server.py" "$HOST" "$PORT" >"$LOG_FILE" 2>&1 &
echo $! > "$PID_FILE"
printf '{\n  "host": "%s",\n  "port": %s,\n  "url": "http://%s:%s/"\n}\n' "$HOST" "$PORT" "$HOST" "$PORT" > "$STATE_FILE"
sleep 2

echo "MultiClaw web started"
echo "URL: http://$HOST:$PORT/"
echo "Log: $LOG_FILE"
