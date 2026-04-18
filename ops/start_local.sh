#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PID_FILE="$ROOT/ops/multiclaw-web.local.pid"
LOG_FILE="$ROOT/ops/multiclaw-web.local.log"
STATE_FILE="$ROOT/ops/multiclaw-web.local.state.json"
RUNTIME_ENV_FILE="$ROOT/.multiclaw/runtime.env"
PORT="${1:-8813}"
HOST="127.0.0.1"

if [[ -f "$RUNTIME_ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$RUNTIME_ENV_FILE"
  set +a
fi

export MULTICLAW_AUTH_MODE="${MULTICLAW_AUTH_MODE:-single-user}"

if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  echo "MultiClaw web already running on http://$HOST:$PORT"
  exit 0
fi

nohup python3 "$ROOT/ops/server.py" "$HOST" "$PORT" >"$LOG_FILE" 2>&1 &
PID="$!"
echo "$PID" > "$PID_FILE"
printf '{\n  "host": "%s",\n  "port": %s,\n  "url": "http://%s:%s/"\n}\n' "$HOST" "$PORT" "$HOST" "$PORT" > "$STATE_FILE"

HEALTH_URL="http://$HOST:$PORT/api/health"
for _ in $(seq 1 20); do
  if curl --silent --show-error --max-time 2 "$HEALTH_URL" >/dev/null 2>&1; then
    echo "MultiClaw web started"
    echo "URL: http://$HOST:$PORT/"
    echo "Health: $HEALTH_URL"
    echo "Log: $LOG_FILE"
    echo ""
    echo "Next:"
    echo "  1. Open http://$HOST:$PORT/"
    echo "  2. Run multiclaw verify"
    echo "  3. Stop with multiclaw stop"
    exit 0
  fi
  sleep 1
done

if kill -0 "$PID" 2>/dev/null; then
  kill "$PID" 2>/dev/null || true
fi
rm -f "$PID_FILE"

echo "MultiClaw failed to become healthy on $HEALTH_URL" >&2
echo "Last log lines:" >&2
tail -n 30 "$LOG_FILE" >&2 || true
exit 1
