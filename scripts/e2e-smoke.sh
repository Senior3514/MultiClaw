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

expect_status() {
  local expected="$1"
  shift
  local actual
  actual="$(curl --silent --show-error --output /dev/null --write-out '%{http_code}' "$@")"
  [[ "$actual" == "$expected" ]]
}

echo "[1/24] health"
curl --fail --silent --show-error "$BASE_URL/api/health" >/dev/null

echo "[2/24] security headers"
curl --fail --silent --show-error -D "$HEADERS_FILE" -o /dev/null "$BASE_URL/"
grep -qi '^x-frame-options: DENY' "$HEADERS_FILE"
grep -qi '^x-content-type-options: nosniff' "$HEADERS_FILE"
grep -qi '^content-security-policy:' "$HEADERS_FILE"
grep -qi '^cross-origin-opener-policy: same-origin' "$HEADERS_FILE"

echo "[3/24] auth baseline on stats"
if [[ "$AUTH_MODE" == "multi-user" ]]; then
  expect_status 401 "$BASE_URL/api/stats"
else
  expect_status 200 "$BASE_URL/api/stats"
fi

echo "[4/24] landing page"
check_page "$BASE_URL/" "MultiClaw"

echo "[5/24] install page"
check_page "$BASE_URL/install.html" "Install MultiClaw"

echo "[6/24] walkthrough page"
check_page "$BASE_URL/walkthrough.html" "Walkthrough"

echo "[7/24] signup"
curl --fail --silent --show-error -D "$HEADERS_FILE" -c "$COOKIE_JAR" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  "$BASE_URL/api/auth/signup" >/dev/null

if [[ "$AUTH_MODE" == "multi-user" ]]; then
  grep -qi '^set-cookie:' "$HEADERS_FILE"
  grep -qi 'HttpOnly' "$HEADERS_FILE"
  grep -qi 'SameSite=Strict' "$HEADERS_FILE"
  grep -q '[[:graph:]]' "$COOKIE_JAR"
fi

echo "[8/24] me"
ME_RESPONSE="$(curl --fail --silent --show-error -b "$COOKIE_JAR" "$BASE_URL/api/auth/me")"
if [[ "$AUTH_MODE" == "multi-user" ]]; then
  printf '%s' "$ME_RESPONSE" | grep -q "$EMAIL"
fi

echo "[9/24] dashboard page"
check_page "$BASE_URL/dashboard.html" "Company pulse" auth

echo "[10/24] generator page"
check_page "$BASE_URL/generator.html" "Generate company" auth

echo "[11/24] invalid json rejected"
INVALID_JSON_STATUS="$(curl --silent --show-error --output /tmp/multiclaw-invalid-json.out --write-out '%{http_code}' -b "$COOKIE_JAR" -H 'Content-Type: application/json' -d '{"broken":' "$BASE_URL/api/generate")"
[[ "$INVALID_JSON_STATUS" == "400" ]]
grep -q 'invalid json body' /tmp/multiclaw-invalid-json.out

echo "[12/24] oversized body rejected"
OVERSIZE_FILE="$(mktemp)"
python3 - <<'PY' > "$OVERSIZE_FILE"
print('{"description":"' + ('x' * 300000) + '"}')
PY
OVERSIZE_STATUS="$(curl --silent --show-error --output /tmp/multiclaw-oversize.out --write-out '%{http_code}' -b "$COOKIE_JAR" -H 'Content-Type: application/json' --data-binary @"$OVERSIZE_FILE" "$BASE_URL/api/generate")"
rm -f "$OVERSIZE_FILE"
[[ "$OVERSIZE_STATUS" == "413" ]]
grep -q 'request body too large' /tmp/multiclaw-oversize.out

echo "[13/24] generate"
GENERATE_RESPONSE="$(curl --fail --silent --show-error -b "$COOKIE_JAR" \
  -H 'Content-Type: application/json' \
  -d '{"productOrigin":"Existing product","autonomyMode":"Operator-assisted","projectName":"SmokeCo","description":"A smoke test company","audience":"Testers","businessModel":"SaaS","stage":"MVP","topGoals":"Verify the full flow","tone":"Sharp"}' \
  "$BASE_URL/api/generate")"
COMPANY_ID="$(printf '%s' "$GENERATE_RESPONSE" | python3 -c 'import json,sys; print(json.load(sys.stdin)["companyId"])')"

echo "[14/24] stats api"
STATS_RESPONSE="$(curl --fail --silent --show-error -b "$COOKIE_JAR" "$BASE_URL/api/stats")"
printf '%s' "$STATS_RESPONSE" | grep -q '"companies"'
printf '%s' "$STATS_RESPONSE" | grep -q '"artifacts"'

echo "[15/24] companies api"
curl --fail --silent --show-error -b "$COOKIE_JAR" \
  "$BASE_URL/api/companies" >/dev/null

echo "[16/24] companies page"
check_page "$BASE_URL/companies.html" "Browse the companies created by MultiClaw" auth

echo "[17/24] company page"
check_page "$BASE_URL/company.html?id=$COMPANY_ID" "Talk to the company" auth

echo "[18/24] artifacts"
curl --fail --silent --show-error -b "$COOKIE_JAR" \
  "$BASE_URL/api/company/$COMPANY_ID/artifacts" >/dev/null

echo "[19/24] pack download"
curl --fail --silent --show-error -b "$COOKIE_JAR" \
  "$BASE_URL/api/company/$COMPANY_ID/download" >/dev/null

echo "[20/24] traversal blocked"
TRAVERSAL_STATUS="$(curl --silent --show-error --output /dev/null --write-out '%{http_code}' -b "$COOKIE_JAR" "$BASE_URL/api/company/..%2F..%2Fetc%2Fpasswd")"
[[ "$TRAVERSAL_STATUS" == "404" ]]

echo "[21/24] ask company"
curl --fail --silent --show-error -b "$COOKIE_JAR" \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"what should this company do next?"}' \
  "$BASE_URL/api/company/$COMPANY_ID/ask" >/dev/null

echo "[22/24] unsupported media type rejected"
UNSUPPORTED_STATUS="$(curl --silent --show-error --output /tmp/multiclaw-unsupported.out --write-out '%{http_code}' -b "$COOKIE_JAR" -H 'Content-Type: text/plain' -d 'hello' "$BASE_URL/api/company/$COMPANY_ID/ask")"
[[ "$UNSUPPORTED_STATUS" == "415" ]]
grep -q 'content type must be application/json' /tmp/multiclaw-unsupported.out

echo "[23/24] run execution cycle"
CYCLE_RESPONSE="$(curl --fail --silent --show-error -b "$COOKIE_JAR" \
  -H 'Content-Type: application/json' \
  -d '{}' \
  "$BASE_URL/api/company/$COMPANY_ID/cycle")"
printf '%s' "$CYCLE_RESPONSE" | grep -q '"cycleNumber"'

echo "[24/24] run autopilot cycle"
AUTOPILOT_RESPONSE="$(curl --fail --silent --show-error -b "$COOKIE_JAR" \
  -H 'Content-Type: application/json' \
  -d '{"enabled":true,"runNow":true}' \
  "$BASE_URL/api/company/$COMPANY_ID/autopilot")"
printf '%s' "$AUTOPILOT_RESPONSE" | grep -q '"runCount"'

echo "MultiClaw smoke test passed: $BASE_URL (company: $COMPANY_ID)"
