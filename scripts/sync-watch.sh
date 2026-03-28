#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/_env.sh"
source "$SCRIPT_DIR/_ui.sh"
source "$SCRIPT_DIR/_sync.sh"

if [ ! -f "$ENV_FILE" ]; then
    ui_error_box ".env file not found. Run: cp .env.example .env"
    exit 1
fi

# ── Banner ───────────────────────────────────────────────────
ui_banner "Sync Watch" "Watching for changes..."

ui_section "Connection" "🔗"
ui_key_value "Theme:" "${C_BRIGHT_WHITE}${C_BOLD}$THEME_SLUG${C_RESET}"
ui_key_value "Protocol:" "${C_BRIGHT_CYAN}$SYNC_PROTOCOL${C_RESET}"
ui_key_value "Target:" "$REMOTE_USER@$REMOTE_HOST:$REMOTE_THEME_PATH"
ui_key_value "Delete:" "$([ "$SYNC_DELETE" = "true" ] && echo -e "${C_RED}${C_BOLD}ON${C_RESET}" || echo -e "${C_GREEN}off${C_RESET}")"

# Detect watcher
WATCHER="polling"
case "$OSTYPE" in
    darwin*)
        command -v fswatch &>/dev/null && WATCHER="fswatch"
        ;;
    linux-gnu*)
        command -v inotifywait &>/dev/null && WATCHER="inotifywait"
        ;;
esac
ui_key_value "Watcher:" "$WATCHER"

ui_section "Sync Log" "📡"

# ── Initial sync ─────────────────────────────────────────────
echo -e "  ${C_BRIGHT_YELLOW}●${C_RESET} Initial sync..."
sync_push

echo ""
echo -e "  ${C_GREEN}${C_BOLD}👀 Watching for changes...${C_RESET} ${C_DIM}(Ctrl+C to stop)${C_RESET}"
echo -e "  ${C_DIM}$(printf '─%.0s' $(seq 1 50))${C_RESET}"

# ── Watch loop ───────────────────────────────────────────────
case "$WATCHER" in
    fswatch)
        fswatch -o -r --latency 0.5 \
            --exclude "\.git" --exclude "node_modules" --exclude "\.DS_Store" \
            "$LOCAL_THEME_PATH" | while read -r _; do
            sync_push
        done
        ;;
    inotifywait)
        inotifywait -m -r -e modify,create,delete,move \
            --exclude "(\.git|node_modules)" \
            "$LOCAL_THEME_PATH" | while read -r _; do
            sleep 0.5
            sync_push
        done
        ;;
    polling)
        echo -e "  ${C_DIM}Polling every 2s...${C_RESET}"
        while true; do
            sleep 2
            sync_push
        done
        ;;
esac
