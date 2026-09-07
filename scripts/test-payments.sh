#!/bin/bash
# Smoke-tests the MoMo endpoint's phone validation and the network-mismatch guard.
#
# Usage: scripts/test-payments.sh <email> <password> <order-id>
#
# The order must belong to the user you log in as, and must be an unpaid order
# whose payment_method is MOMO (MTN) for the mismatch case to fire.
set -euo pipefail

EMAIL=${1:-}
PASSWORD=${2:-}
ORDER_ID=${3:-}

if [ -z "$EMAIL" ] || [ -z "$PASSWORD" ] || [ -z "$ORDER_ID" ]; then
  echo "Usage: $0 <email> <password> <order-id>" >&2
  exit 1
fi

# Pull the project URL and anon key from the frontend env rather than hardcoding
# a placeholder host. Both can be overridden from the environment.
ENV_FILE="$(dirname "$0")/../Frontend/.env"
read_env() { grep -E "^$1=" "$ENV_FILE" 2>/dev/null | tail -1 | cut -d= -f2- | tr -d '\r"'; }

SUPABASE_URL=${SUPABASE_URL:-$(read_env VITE_SUPABASE_URL)}
ANON_KEY=${ANON_KEY:-$(read_env VITE_SUPABASE_KEY)}
FUNCTIONS_URL=${FUNCTIONS_URL:-$(read_env VITE_SUPABASE_FUNCTIONS_URL)}

if [ -z "$SUPABASE_URL" ] || [ -z "$ANON_KEY" ]; then
  echo "Could not read VITE_SUPABASE_URL / VITE_SUPABASE_KEY from $ENV_FILE" >&2
  exit 1
fi
FUNCTIONS_URL=${FUNCTIONS_URL:-$SUPABASE_URL/functions/v1/api}

# curl on Windows fails TLS revocation checks against Supabase; harmless elsewhere.
CURL=(curl -sS)
case "$(uname -s)" in MINGW*|MSYS*|CYGWIN*) CURL+=(--ssl-no-revoke) ;; esac

# Log in through GoTrue. The password grant lives at /auth/v1/token, not /auth/login,
# and it needs the anon key as an apikey header.
LOGIN=$("${CURL[@]}" -X POST "$SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo "$LOGIN" | jq -r '.access_token // empty')
if [ -z "$TOKEN" ]; then
  echo "Login failed: $LOGIN" >&2
  exit 1
fi

# The endpoint reads body.phone — anything else comes back as "Phone number is required".
pay() {
  local label=$1 phone=$2
  echo "--- $label: $phone"
  "${CURL[@]}" -w '\nHTTP %{http_code}\n\n' \
    -H "apikey: $ANON_KEY" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"phone\":\"$phone\"}" \
    "$FUNCTIONS_URL/payments/momo/$ORDER_ID"
}

# Rejected by normalizeRwandaPhone: too short, wrong prefix (070), non-Rwandan.
for NUM in 12345 070123456 "+1 555 0100"; do
  pay "invalid" "$NUM"
done

# Airtel number (072) against an MTN MoMo order — should trip the mismatch guard,
# not reach Paypack. 0788123456 is MTN and would have matched, so it tested nothing.
pay "airtel number on MTN order" "0728123456"
