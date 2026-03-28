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

ui_banner "Sync Push" "Uploading theme to remote server"

ui_section "Details" "📦"
ui_key_value "Theme:" "${C_BRIGHT_WHITE}${C_BOLD}$THEME_SLUG${C_RESET}"
ui_key_value "Protocol:" "${C_BRIGHT_CYAN}$SYNC_PROTOCOL${C_RESET}"
ui_key_value "Target:" "$REMOTE_USER@$REMOTE_HOST"
ui_key_value "Path:" "$REMOTE_THEME_PATH"
ui_key_value "Delete:" "$([ "$SYNC_DELETE" = "true" ] && echo -e "${C_RED}${C_BOLD}ON${C_RESET}" || echo -e "${C_GREEN}off${C_RESET}")"

ui_section "Upload" "↑"
sync_push

ui_success_box "Push complete!"
