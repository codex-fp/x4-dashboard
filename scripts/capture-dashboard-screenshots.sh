#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$ROOT_DIR/docs/screenshots"
BASE_URL="${BASE_URL:-http://127.0.0.1:3001}"
SCREENSHOT_WAIT_MS="${SCREENSHOT_WAIT_MS:-2500}"
VIEWPORT="${VIEWPORT:-1920,1080}"

PLAYWRIGHT_CMD=(npx -y playwright screenshot "--wait-for-timeout=${SCREENSHOT_WAIT_MS}" "--viewport-size=${VIEWPORT}")

SERVER_PID=""

cleanup() {
  if [[ -n "${SERVER_PID}" ]] && kill -0 "${SERVER_PID}" 2>/dev/null; then
    kill "${SERVER_PID}" >/dev/null 2>&1 || true
    wait "${SERVER_PID}" 2>/dev/null || true
  fi
}
trap cleanup EXIT

log() {
  echo "[screenshots] $*"
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

api_post() {
  curl -fsS -X POST "$BASE_URL$1" >/dev/null
}

api_state() {
  curl -fsS "$BASE_URL/api/state"
}

get_alert_level() {
  api_state | jq -r '.combat.alertLevel'
}

get_missile_mode() {
  api_state | jq -r 'if .combat.missileIncoming then "incoming" elif .combat.missileLockingOn then "lock" else "none" end'
}

set_alert_level() {
  local target="$1"
  local tries=0
  while [[ "$(get_alert_level)" != "$target" ]]; do
    api_post "/api/mock/combat"
    sleep 0.15
    tries=$((tries + 1))
    if [[ "$tries" -gt 10 ]]; then
      echo "Failed to set alert level to $target" >&2
      exit 1
    fi
  done
}

set_missile_mode() {
  local target="$1"
  local tries=0
  while [[ "$(get_missile_mode)" != "$target" ]]; do
    api_post "/api/mock/missile"
    sleep 0.15
    tries=$((tries + 1))
    if [[ "$tries" -gt 10 ]]; then
      echo "Failed to set missile mode to $target" >&2
      exit 1
    fi
  done
}

capture_dashboard() {
  local dashboard_id="$1"
  local filename="$2"
  local url="$BASE_URL/?dashboard=$dashboard_id&speedometer=arc"
  local output="$OUT_DIR/$filename"
  log "Capture $dashboard_id -> docs/screenshots/$filename"
  "${PLAYWRIGHT_CMD[@]}" "$url" "$output" >/dev/null
}

capture_url() {
  local url="$1"
  local filename="$2"
  local output="$OUT_DIR/$filename"
  log "Capture $url -> docs/screenshots/$filename"
  "${PLAYWRIGHT_CMD[@]}" "$url" "$output" >/dev/null
}

require_cmd curl
require_cmd jq
require_cmd npx
require_cmd npm

mkdir -p "$OUT_DIR"

log "Building client bundle"
(
  cd "$ROOT_DIR"
  npm run build >/dev/null
)

log "Starting mock server"
(
  cd "$ROOT_DIR"
  node server/index.js --mock >/tmp/x4-dashboard-screenshots-server.log 2>&1 &
  SERVER_PID=$!
  echo "$SERVER_PID" > /tmp/x4-dashboard-screenshots-server.pid
)
SERVER_PID="$(cat /tmp/x4-dashboard-screenshots-server.pid)"
rm -f /tmp/x4-dashboard-screenshots-server.pid

log "Waiting for mock server health endpoint"
for _ in {1..40}; do
  if curl -fsS "$BASE_URL/api/health" >/dev/null 2>&1; then
    break
  fi
  sleep 0.5
done

if ! curl -fsS "$BASE_URL/api/health" >/dev/null 2>&1; then
  echo "Mock server did not become ready at $BASE_URL" >&2
  echo "Server logs: /tmp/x4-dashboard-screenshots-server.log" >&2
  exit 1
fi

log "Normalizing mock combat state"
set_alert_level 0
set_missile_mode none

capture_dashboard "flight" "dashboard-flight-no-target.png"
capture_dashboard "flight-classic" "dashboard-flight-classic.png"
capture_dashboard "ship-controls" "dashboard-ship-controls.png"
capture_dashboard "target" "dashboard-target.png"
capture_dashboard "operations" "dashboard-operations-overview.png"
capture_dashboard "operations-intel" "dashboard-operations-intel.png"
capture_dashboard "operations-missions" "dashboard-operations-missions.png"
capture_dashboard "operations-trade" "dashboard-operations-trade.png"

log "Capturing flight combat variants"
set_alert_level 1
set_missile_mode lock
capture_dashboard "flight" "dashboard-flight-combat-alert-target.png"

set_alert_level 2
set_missile_mode incoming
capture_dashboard "flight-classic" "dashboard-flight-combat-missile-inbound.png"

log "Capturing speedometer variants"
set_alert_level 0
set_missile_mode none
capture_url "$BASE_URL/?dashboard=flight&speedometer=arc" "dashboard-flight-speedometer-arc.png"
capture_url "$BASE_URL/?dashboard=flight&speedometer=bar" "dashboard-flight-speedometer-bar.png"

log "Screenshot capture completed"
