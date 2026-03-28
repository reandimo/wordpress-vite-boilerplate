#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/_env.sh"
source "$SCRIPT_DIR/_sync.sh"

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: .env file not found. Copy .env.example to .env first."
    exit 1
fi

echo "Pulling $THEME_SLUG from $REMOTE_USER@$REMOTE_HOST ($SYNC_PROTOCOL)..."
sync_pull
echo "Pull complete"
