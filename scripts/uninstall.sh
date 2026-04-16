#!/usr/bin/env bash
set -euo pipefail

INSTALL_DIR="${HOME}/MultiClaw"

usage() {
  cat <<'EOF'
MultiClaw uninstall

Usage:
  curl -fsSL https://raw.githubusercontent.com/Senior3514/MultiClaw/main/scripts/uninstall.sh | bash

Options:
  --dir <path>    Install directory to remove (default: ~/MultiClaw)
  --help          Show this help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dir)
      INSTALL_DIR="$2"
      shift 2
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if command -v npm >/dev/null 2>&1; then
  npm unlink -g multiclaw >/dev/null 2>&1 || true
fi

if [[ -d "$INSTALL_DIR" ]]; then
  rm -rf "$INSTALL_DIR"
  echo "Removed $INSTALL_DIR"
else
  echo "Install directory not found: $INSTALL_DIR"
fi

echo "MultiClaw uninstall complete."
