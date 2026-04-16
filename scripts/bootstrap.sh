#!/usr/bin/env bash
set -euo pipefail

REPO_URL="https://github.com/Senior3514/MultiClaw.git"
INSTALL_DIR="${HOME}/MultiClaw"
BIND="tailscale"
PORT="8813"
PROVIDER="openai"
MODEL="gpt-5.4"
API_KEY_ENV="OPENAI_API_KEY"
API_KEY=""
START_NOW="0"

need_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --tailscale)
      BIND="tailscale"
      shift
      ;;
    --local)
      BIND="local"
      shift
      ;;
    --port)
      PORT="$2"
      shift 2
      ;;
    --provider)
      PROVIDER="$2"
      shift 2
      ;;
    --model)
      MODEL="$2"
      shift 2
      ;;
    --api-key-env)
      API_KEY_ENV="$2"
      shift 2
      ;;
    --api-key)
      API_KEY="$2"
      START_NOW="1"
      shift 2
      ;;
    --start)
      START_NOW="1"
      shift
      ;;
    --dir)
      INSTALL_DIR="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

need_cmd git
need_cmd node
need_cmd npm
need_cmd python3

if [[ -d "$INSTALL_DIR/.git" ]]; then
  echo "Updating existing MultiClaw install at $INSTALL_DIR"
  git -C "$INSTALL_DIR" pull --ff-only
else
  echo "Cloning MultiClaw into $INSTALL_DIR"
  git clone "$REPO_URL" "$INSTALL_DIR"
fi

cd "$INSTALL_DIR"
npm install
npm link

echo "MultiClaw bootstrap complete."

auto_start() {
  CMD=(multiclaw up "--${BIND}" --port "$PORT" --provider "$PROVIDER" --model "$MODEL" --api-key-env "$API_KEY_ENV")
  if [[ -n "$API_KEY" ]]; then
    CMD+=(--api-key "$API_KEY")
  fi
  printf 'Running: '
  printf '%q ' "${CMD[@]}"
  printf '\n'
  "${CMD[@]}"
  multiclaw status
}

if [[ "$START_NOW" == "1" ]]; then
  auto_start
  exit 0
fi

if [[ -t 0 ]]; then
  echo
  echo "Next recommended step: multiclaw configure"
  read -r -p "Run guided configure now? [Y/n] " answer
  answer="${answer:-Y}"
  if [[ "$answer" =~ ^[Yy]$ ]]; then
    multiclaw configure
    echo
    read -r -p "Start runtime now? [Y/n] " start_answer
    start_answer="${start_answer:-Y}"
    if [[ "$start_answer" =~ ^[Yy]$ ]]; then
      multiclaw start
      multiclaw status
    fi
  else
    echo "Run 'multiclaw walkthrough' when you're ready."
  fi
else
  echo "Run 'multiclaw walkthrough' for the next steps."
fi
