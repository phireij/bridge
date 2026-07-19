#!/usr/bin/env bash
# Mission #002F — Domain Isolation Hotfix
# Repeatable host-routing test. Run against the live deployment (Preview or
# Production) to confirm the reservation domain never exposes Bridge HQ.
#
# Usage: ./scripts/test-host-routing.sh [reservation_host] [bridge_host]
#   Defaults to the real production hostnames if not given.
set -euo pipefail

RES_HOST="${1:-reservations.rubyscakedelights.shop}"
BRIDGE_HOST="${2:-bridge-gray-one.vercel.app}"

pass=0
fail=0

check() {
  local desc="$1" url="$2" expect_status="$3" expect_location_substr="${4:-}"
  local headers status location
  headers=$(curl -s -D - -o /dev/null --max-time 15 "$url")
  status=$(printf '%s' "$headers" | head -1 | awk '{print $2}')
  location=$(printf '%s' "$headers" | grep -i '^location:' | sed 's/^[Ll]ocation: //' | tr -d '\r' || true)

  if [ "$status" != "$expect_status" ]; then
    echo "FAIL: $desc — expected status $expect_status, got $status ($url)"
    fail=$((fail+1))
    return
  fi
  if [ -n "$expect_location_substr" ] && [[ "$location" != *"$expect_location_substr"* ]]; then
    echo "FAIL: $desc — expected redirect containing '$expect_location_substr', got '$location' ($url)"
    fail=$((fail+1))
    return
  fi
  echo "PASS: $desc (status $status${location:+, -> $location})"
  pass=$((pass+1))
}

echo "=== 1. Reservation root redirects to /reserve, never /login ==="
check "reservation root" "https://$RES_HOST/" 307 "/reserve"

echo "=== 2. Reservation flow stays reachable ==="
check "reservation flow" "https://$RES_HOST/reserve" 200

echo "=== 3. Ruby admin stays reachable on the reservation host ==="
check "ruby admin" "https://$RES_HOST/admin" 200

echo "=== 4. Bridge login is never reachable from the reservation host ==="
check "bridge login blocked" "https://$RES_HOST/login" 307 "/reserve"

echo "=== 5. Bridge HQ still gates normally on the Vercel host ==="
check "bridge hq login gate" "https://$BRIDGE_HOST/" 307 "/login"

echo
echo "Results: $pass passed, $fail failed"
[ "$fail" -eq 0 ]
