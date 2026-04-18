#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONFIG_FILE="$ROOT/.multiclaw/config.json"
MODE="${1:-}"

if [[ -z "$MODE" && -f "$CONFIG_FILE" ]]; then
  MODE="$(python3 - <<'PY' "$CONFIG_FILE"
import json, sys
path = sys.argv[1]
try:
    with open(path, 'r', encoding='utf-8') as f:
        print((json.load(f).get('bind') or '').strip())
except Exception:
    print('')
PY
)"
fi

MODE="${MODE:-tailscale}"

case "$MODE" in
  local|tailscale) ;;
  *)
    echo "Unsupported mode: $MODE" >&2
    exit 1
    ;;
esac

PID_FILE="$ROOT/ops/multiclaw-web.$MODE.pid"
STATE_FILE="$ROOT/ops/multiclaw-web.$MODE.state.json"

if [[ ! -f "$PID_FILE" ]]; then
  echo "No PID file found for mode: $MODE"
  exit 0
fi

PID="$(cat "$PID_FILE")"
if kill -0 "$PID" 2>/dev/null; then
  kill "$PID"
  echo "Stopped MultiClaw web ($PID) [$MODE]"
else
  echo "Process not running [$MODE]"
fi

rm -f "$PID_FILE"
rm -f "$STATE_FILE"
