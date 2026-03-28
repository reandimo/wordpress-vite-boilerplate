#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/_env.sh"

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: .env file not found. Copy .env.example to .env first."
    exit 1
fi

TUNNEL_TOOL="${TUNNEL_TOOL:-cloudflared}"
TUNNEL_DOMAIN="${TUNNEL_DOMAIN:-}"

if [ -z "$TUNNEL_DOMAIN" ]; then
    echo "Error: TUNNEL_DOMAIN is not set in .env"
    exit 1
fi

case "$TUNNEL_TOOL" in
    ngrok)
        if ! command -v ngrok &>/dev/null; then
            echo "Error: ngrok is not installed."
            exit 1
        fi
        echo "Opening tunnel with ngrok..."
        ngrok http "https://$TUNNEL_DOMAIN"
        ;;
    cloudflared)
        if ! command -v cloudflared &>/dev/null; then
            echo "Error: cloudflared is not installed."
            exit 1
        fi
        echo "Opening tunnel with Cloudflare..."
        cloudflared tunnel --url "https://$TUNNEL_DOMAIN"
        ;;
    *)
        echo "Error: Unknown TUNNEL_TOOL '$TUNNEL_TOOL'. Use 'ngrok' or 'cloudflared'."
        exit 1
        ;;
esac
