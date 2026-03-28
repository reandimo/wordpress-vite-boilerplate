#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/_env.sh"
source "$SCRIPT_DIR/_ui.sh"

if [ ! -f "$ENV_FILE" ]; then
    ui_error_box ".env file not found. Run: cp .env.example .env"
    exit 1
fi

TUNNEL_TOOL="${TUNNEL_TOOL:-cloudflared}"
TUNNEL_DOMAIN="${TUNNEL_DOMAIN:-}"

if [ -z "$TUNNEL_DOMAIN" ]; then
    ui_error_box "TUNNEL_DOMAIN is not set in .env"
    exit 1
fi

ui_banner "Public Tunnel" "Exposing remote site to the internet"

ui_section "Configuration" "🚇"
ui_key_value "Tool:" "${C_BRIGHT_CYAN}${C_BOLD}$TUNNEL_TOOL${C_RESET}"
ui_key_value "Domain:" "${C_UNDERLINE}$TUNNEL_DOMAIN${C_RESET}"

ui_section "Tunnel" "🌍"

case "$TUNNEL_TOOL" in
    ngrok)
        if ! command -v ngrok &>/dev/null; then
            ui_fail "ngrok is not installed"
            ui_detail "Install: ${C_YELLOW}choco install ngrok${C_RESET}"
            exit 1
        fi
        ui_ok "Starting ngrok tunnel..."
        echo ""
        ngrok http "https://$TUNNEL_DOMAIN"
        ;;
    cloudflared)
        if ! command -v cloudflared &>/dev/null; then
            ui_fail "cloudflared is not installed"
            ui_detail "Install: ${C_YELLOW}choco install cloudflared${C_RESET}"
            exit 1
        fi
        ui_ok "Starting Cloudflare tunnel..."
        echo ""
        cloudflared tunnel --url "https://$TUNNEL_DOMAIN"
        ;;
    *)
        ui_error_box "Unknown TUNNEL_TOOL '$TUNNEL_TOOL'. Use 'ngrok' or 'cloudflared'."
        exit 1
        ;;
esac
