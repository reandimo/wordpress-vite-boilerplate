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

ui_banner "Sync Pull" "Downloading theme from remote server"

ui_section "Details" "📦"
ui_key_value "Theme:" "${C_BRIGHT_WHITE}${C_BOLD}$THEME_SLUG${C_RESET}"
ui_key_value "Protocol:" "${C_BRIGHT_CYAN}$SYNC_PROTOCOL${C_RESET}"
ui_key_value "Source:" "$REMOTE_USER@$REMOTE_HOST"
ui_key_value "Path:" "$REMOTE_THEME_PATH"

ui_section "Download" "↓"
sync_pull

ui_success_box "Pull complete!"
