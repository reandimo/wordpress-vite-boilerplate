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
ui_key_value "Theme:" "$THEME_SLUG"
ui_key_value "Protocol:" "$SYNC_PROTOCOL"
ui_key_value "Target:" "$REMOTE_USER@$REMOTE_HOST:$REMOTE_THEME_PATH"
if [ "$SYNC_DELETE" = "true" ]; then
    printf "  %s%-14s%s %s%sON%s\n" "$C_DIM" "Delete:" "$C_RESET" "$C_RED" "$C_BOLD" "$C_RESET"
else
    printf "  %s%-14s%s %soff%s\n" "$C_DIM" "Delete:" "$C_RESET" "$C_GREEN" "$C_RESET"
fi

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
printf "  %s●%s Initial sync...\n" "$C_BRIGHT_YELLOW" "$C_RESET"
sync_push

echo ""
printf "  %s%s👀 Watching for changes...%s %s(Ctrl+C to stop)%s\n" "$C_GREEN" "$C_BOLD" "$C_RESET" "$C_DIM" "$C_RESET"
ui_divider

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
        printf "  %sPolling every 2s...%s\n" "$C_DIM" "$C_RESET"
        while true; do
            sleep 2
            sync_push
        done
        ;;
esac
