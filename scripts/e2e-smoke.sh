#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-${MULTICLAW_BASE_URL:-http://127.0.0.1:8813}}"
AUTH_MODE="${MULTICLAW_AUTH_MODE:-single-user}"
COOKIE_JAR="$(mktemp)"
HEADERS_FILE="$(mktemp)"
EMAIL="smoke$(date +%s)@example.com"
PASSWORD="supersecure123"

cleanup() {
  rm -f "$COOKIE_JAR" "$HEADERS_FILE"
}
trap cleanup EXIT

check_page() {
  local url="$1"
  local needle="$2"
  local cookie_mode="${3:-none}"
  local html

  if [[ "$cookie_mode" == "auth" ]]; then
    html="$(curl --fail --silent --show-error -b "$COOKIE_JAR" "$url")"
  else
    html="$(curl --fail --silent --show-error "$url")"
  fi

  printf '%s' "$html" | grep -q "$needle"
}

echo "[1/18] health"
curl --fail --silent --show-error "$BASE_URL/api/health" >/dev/null

echo "[2/18] landing page"
check_page "$BASE_URL/" "MultiClaw"

echo "[3/18] install page"
check_page "$BASE_URL/install.html" "Install MultiClaw"

echo "[4/18] walkthrough page"
check_page "$BASE_URL/walkthrough.html" "Walkthrough"

echo "[5/18] signup"
curl --fail --silent --show-error -D "$HEADERS_FILE" -c "$COOKIE_JAR" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  "$BASE_URL/api/auth/signup" >/dev/null

if [[ "$AUTH_MODE" == "multi-user" ]]; then
  grep -qi '^set-cookie:' "$HEADERS_FILE"
  grep -q '[[:graph:]]' "$COOKIE_JAR"
fi

echo "[6/18] me"
ME_RESPONSE="$(curl --fail --silent --show-error -b "$COOKIE_JAR" "$BASE_URL/api/auth/me")"
if [[ "$AUTH_MODE" == "multi-user" ]]; then
  printf '%s' "$ME_RESPONSE" | grep -q "$EMAIL"
fi

echo "[7/18] dashboard page"
check_page "$BASE_URL/dashboard.html" "Mission control" auth

echo "[8/18] generator page"
check_page "$BASE_URL/generator.html" "Generate company" auth

echo "[9/18] generate"
GENERATE_RESPONSE="$(curl --fail --silent --show-error -b "$COOKIE_JAR" \
  -H 'Content-Type: application/json' \
  -d '{"productOrigin":"Existing product","autonomyMode":"Operator-assisted","projectName":"SmokeCo","description":"A smoke test company","audience":"Testers","businessModel":"SaaS","stage":"MVP","topGoals":"Verify the full flow","tone":"Sharp"}' \
  "$BASE_URL/api/generate")"
COMPANY_ID="$(printf '%s' "$GENERATE_RESPONSE" | python3 -c 'import json,sys; print(json.load(sys.stdin)["companyId"])')"

echo "[10/18] stats api"
STATS_RESPONSE="$(curl --fail --silent --show-error -b "$COOKIE_JAR" "$BASE_URL/api/stats")"
printf '%s' "$STATS_RESPONSE" | grep -q '"companies"'
printf '%s' "$STATS_RESPONSE" | grep -q '"artifacts"'

echo "[11/18] companies api"
curl --fail --silent --show-error -b "$COOKIE_JAR" \
  "$BASE_URL/api/companies" >/dev/null

echo "[12/18] companies page"
check_page "$BASE_URL/companies.html" "Browse the companies created by MultiClaw" auth

echo "[13/18] company page"
check_page "$BASE_URL/company.html?id=$COMPANY_ID" "Talk to the company" auth

echo "[14/18] artifacts"
curl --fail --silent --show-error -b "$COOKIE_JAR" \
  "$BASE_URL/api/company/$COMPANY_ID/artifacts" >/dev/null

echo "[15/18] pack download"
curl --fail --silent --show-error -b "$COOKIE_JAR" \
  "$BASE_URL/api/company/$COMPANY_ID/download" >/dev/null

echo "[16/18] ask company"
curl --fail --silent --show-error -b "$COOKIE_JAR" \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"what should this company do next?"}' \
  "$BASE_URL/api/company/$COMPANY_ID/ask" >/dev/null

echo "[17/18] run execution cycle"
CYCLE_RESPONSE="$(curl --fail --silent --show-error -b "$COOKIE_JAR" \
  -H 'Content-Type: application/json' \
  -d '{}' \
  "$BASE_URL/api/company/$COMPANY_ID/cycle")"
printf '%s' "$CYCLE_RESPONSE" | grep -q '"cycleNumber"'

echo "[18/18] pulse api"
PULSE_RESPONSE="$(curl --fail --silent --show-error -b "$COOKIE_JAR" "$BASE_URL/api/pulse")"
printf '%s' "$PULSE_RESPONSE" | grep -q '"companies"'
printf '%s' "$PULSE_RESPONSE" | grep -q '"cognitiveLoad"'

echo "MultiClaw smoke test passed: $BASE_URL (company: $COMPANY_ID)"
