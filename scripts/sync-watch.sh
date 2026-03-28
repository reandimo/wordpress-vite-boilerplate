#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/_env.sh"
source "$SCRIPT_DIR/_sync.sh"

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: .env file not found. Copy .env.example to .env first."
    exit 1
fi

echo "Watching: $LOCAL_THEME_PATH"
echo "Target:   $REMOTE_USER@$REMOTE_HOST:$REMOTE_THEME_PATH ($SYNC_PROTOCOL)"
echo "Press Ctrl+C to stop"
echo ""

# Initial sync
sync_push

# Watch for changes based on OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    if ! command -v fswatch &>/dev/null; then
        echo "Error: fswatch is required on macOS. Install with: brew install fswatch"
        exit 1
    fi
    fswatch -o -r --latency 0.5 \
        --exclude "\.git" --exclude "node_modules" --exclude "\.DS_Store" \
        "$LOCAL_THEME_PATH" | while read -r _; do
        sync_push
    done
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    if ! command -v inotifywait &>/dev/null; then
        echo "inotifywait not found, falling back to polling mode..."
        while true; do
            sleep 2
            sync_push
        done
    else
        inotifywait -m -r -e modify,create,delete,move \
            --exclude "(\.git|node_modules)" \
            "$LOCAL_THEME_PATH" | while read -r _; do
            sleep 0.5
            sync_push
        done
    fi
else
    echo "Windows detected, using polling mode (2s interval)..."
    while true; do
        sleep 2
        sync_push
    done
fi
