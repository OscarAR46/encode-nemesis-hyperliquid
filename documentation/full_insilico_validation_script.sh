#/bin/env zsh
BASE_URL="${1:-http://localhost:3000}"
TEST_USER="${2:-0x1234567890abcdef1234567890abcdef12345678}"

echo "=== Ledger API Validation ==="
echo "Base URL: $BASE_URL"
echo "Test User: $TEST_USER"
echo

echo "1. Health Check"
curl -s "${BASE_URL}/v1/health" | jq '.success, .data.healthy'
echo

echo "2. Trades"
curl -s "${BASE_URL}/v1/trades?user=${TEST_USER}&limit=5" | jq '.success, (.data | length)'
echo

echo "3. Position History"
curl -s "${BASE_URL}/v1/positions/history?user=${TEST_USER}" | jq '.success, (.data | length)'
echo

echo "4. PnL"
curl -s "${BASE_URL}/v1/pnl?user=${TEST_USER}" | jq '.success, .data.realizedPnl, .data.returnPct'
echo

echo "5. Leaderboard"
curl -s "${BASE_URL}/v1/leaderboard?metric=pnl&limit=5" | jq '.success, (.data | length)'
