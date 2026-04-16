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

echo "[1/8] health"
curl --fail --silent --show-error "$BASE_URL/api/health" >/dev/null

echo "[2/8] signup"
curl --fail --silent --show-error -c "$COOKIE_JAR" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  "$BASE_URL/api/auth/signup" >/dev/null

echo "[3/8] me"
curl --fail --silent --show-error -b "$COOKIE_JAR" \
  "$BASE_URL/api/auth/me" >/dev/null

echo "[4/8] generate"
GENERATE_RESPONSE="$(curl --fail --silent --show-error -b "$COOKIE_JAR" \
  -H 'Content-Type: application/json' \
  -d '{"productOrigin":"Existing product","autonomyMode":"Operator-assisted","projectName":"SmokeCo","description":"A smoke test company","audience":"Testers","businessModel":"SaaS","stage":"MVP","topGoals":"Verify the full flow","tone":"Sharp"}' \
  "$BASE_URL/api/generate")"
COMPANY_ID="$(printf '%s' "$GENERATE_RESPONSE" | python3 -c 'import json,sys; print(json.load(sys.stdin)["companyId"])')"

echo "[5/8] companies"
curl --fail --silent --show-error -b "$COOKIE_JAR" \
  "$BASE_URL/api/companies" >/dev/null

echo "[6/8] company"
curl --fail --silent --show-error -b "$COOKIE_JAR" \
  "$BASE_URL/api/company/$COMPANY_ID" >/dev/null

echo "[7/8] artifacts"
curl --fail --silent --show-error -b "$COOKIE_JAR" \
  "$BASE_URL/api/company/$COMPANY_ID/artifacts" >/dev/null

echo "[8/8] pack download"
curl --fail --silent --show-error -b "$COOKIE_JAR" \
  "$BASE_URL/api/company/$COMPANY_ID/download" >/dev/null

echo "MultiClaw smoke test passed: $BASE_URL (company: $COMPANY_ID)"
