#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PID_FILE="$ROOT/ops/multiclaw-web.pid"
LOG_FILE="$ROOT/ops/multiclaw-web.log"
PORT="${1:-8813}"
TS_IP="$(tailscale ip -4 | head -n1)"

if [[ -z "$TS_IP" ]]; then
  echo "Could not determine Tailscale IPv4 address"
  exit 1
fi

if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  echo "MultiClaw web already running on http://$TS_IP:$PORT"
  exit 0
fi

nohup python3 "$ROOT/ops/server.py" "$TS_IP" "$PORT" >"$LOG_FILE" 2>&1 &
echo $! > "$PID_FILE"
sleep 2

echo "MultiClaw web started"
echo "URL: http://$TS_IP:$PORT/"
echo "Log: $LOG_FILE"
