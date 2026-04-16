#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PID_FILE="$ROOT/ops/multiclaw-web.pid"
STATE_FILE="$ROOT/ops/multiclaw-web.state.json"

if [[ ! -f "$PID_FILE" ]]; then
  echo "No PID file found"
  exit 0
fi

PID="$(cat "$PID_FILE")"
if kill -0 "$PID" 2>/dev/null; then
  kill "$PID"
  echo "Stopped MultiClaw web ($PID)"
else
  echo "Process not running"
fi

rm -f "$PID_FILE"
rm -f "$STATE_FILE"
