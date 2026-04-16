#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-${MULTICLAW_BASE_URL:-http://127.0.0.1:8813}}"
COOKIE_JAR="$(mktemp)"
EMAIL="smoke$(date +%s)@example.com"
PASSWORD="supersecure123"

cleanup() {
  rm -f "$COOKIE_JAR"
}
trap cleanup EXIT

echo "[1/5] health"
curl --fail --silent --show-error "$BASE_URL/api/health" >/dev/null

echo "[2/5] signup"
curl --fail --silent --show-error -c "$COOKIE_JAR" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  "$BASE_URL/api/auth/signup" >/dev/null

echo "[3/5] me"
curl --fail --silent --show-error -b "$COOKIE_JAR" \
  "$BASE_URL/api/auth/me" >/dev/null

echo "[4/5] generate"
curl --fail --silent --show-error -b "$COOKIE_JAR" \
  -H 'Content-Type: application/json' \
  -d '{"productOrigin":"Existing product","autonomyMode":"Operator-assisted","projectName":"SmokeCo","description":"A smoke test company","audience":"Testers","businessModel":"SaaS","stage":"MVP","topGoals":"Verify the full flow","tone":"Sharp"}' \
  "$BASE_URL/api/generate" >/dev/null

echo "[5/5] companies"
curl --fail --silent --show-error -b "$COOKIE_JAR" \
  "$BASE_URL/api/companies" >/dev/null

echo "MultiClaw smoke test passed: $BASE_URL"
