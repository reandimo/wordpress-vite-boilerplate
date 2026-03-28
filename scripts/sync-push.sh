#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/_env.sh"
source "$SCRIPT_DIR/_sync.sh"

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: .env file not found. Copy .env.example to .env first."
    exit 1
fi

echo "Pushing $THEME_SLUG to $REMOTE_USER@$REMOTE_HOST ($SYNC_PROTOCOL)..."
sync_push
echo "Push complete"
