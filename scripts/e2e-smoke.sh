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

echo "[1/15] health"
curl --fail --silent --show-error "$BASE_URL/api/health" >/dev/null

echo "[2/15] landing page"
check_page "$BASE_URL/" "MultiClaw"

echo "[3/15] install page"
check_page "$BASE_URL/install.html" "Install MultiClaw"

echo "[4/15] walkthrough page"
check_page "$BASE_URL/walkthrough.html" "Walkthrough"

echo "[5/15] signup"
curl --fail --silent --show-error -c "$COOKIE_JAR" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  "$BASE_URL/api/auth/signup" >/dev/null

echo "[6/15] me"
curl --fail --silent --show-error -b "$COOKIE_JAR" \
  "$BASE_URL/api/auth/me" >/dev/null

echo "[7/15] dashboard page"
check_page "$BASE_URL/dashboard.html" "Mission control" auth

echo "[8/15] generator page"
check_page "$BASE_URL/generator.html" "Generate company" auth

echo "[9/15] generate"
GENERATE_RESPONSE="$(curl --fail --silent --show-error -b "$COOKIE_JAR" \
  -H 'Content-Type: application/json' \
  -d '{"productOrigin":"Existing product","autonomyMode":"Operator-assisted","projectName":"SmokeCo","description":"A smoke test company","audience":"Testers","businessModel":"SaaS","stage":"MVP","topGoals":"Verify the full flow","tone":"Sharp"}' \
  "$BASE_URL/api/generate")"
COMPANY_ID="$(printf '%s' "$GENERATE_RESPONSE" | python3 -c 'import json,sys; print(json.load(sys.stdin)["companyId"])')"

echo "[10/15] companies api"
curl --fail --silent --show-error -b "$COOKIE_JAR" \
  "$BASE_URL/api/companies" >/dev/null

echo "[11/15] companies page"
check_page "$BASE_URL/companies.html" "Browse the companies created by MultiClaw" auth

echo "[12/15] company page"
check_page "$BASE_URL/company.html?id=$COMPANY_ID" "Talk to the company" auth

echo "[13/15] artifacts"
curl --fail --silent --show-error -b "$COOKIE_JAR" \
  "$BASE_URL/api/company/$COMPANY_ID/artifacts" >/dev/null

echo "[14/15] pack download"
curl --fail --silent --show-error -b "$COOKIE_JAR" \
  "$BASE_URL/api/company/$COMPANY_ID/download" >/dev/null

echo "[15/15] ask company"
curl --fail --silent --show-error -b "$COOKIE_JAR" \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"what should this company do next?"}' \
  "$BASE_URL/api/company/$COMPANY_ID/ask" >/dev/null

echo "MultiClaw smoke test passed: $BASE_URL (company: $COMPANY_ID)"
