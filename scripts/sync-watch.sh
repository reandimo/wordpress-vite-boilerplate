#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/_env.sh"

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: .env file not found. Copy .env.example to .env first."
    exit 1
fi

# Validate required vars
for var in REMOTE_USER REMOTE_HOST REMOTE_THEME_PATH; do
    if [ -z "${!var:-}" ]; then
        echo "Error: $var is not set in .env"
        exit 1
    fi
done

REMOTE_PORT="${REMOTE_PORT:-22}"
SYNC_DELETE="${SYNC_DELETE:-true}"
SYNC_EXCLUDE="${SYNC_EXCLUDE:-.git,node_modules,.DS_Store,*.log,.env,public/hot}"

# Build rsync options
RSYNC_OPTS="-avz --compress --checksum"

if [ "$SYNC_DELETE" = "true" ]; then
    RSYNC_OPTS="$RSYNC_OPTS --delete"
fi

IFS=',' read -ra EXCLUDES <<< "$SYNC_EXCLUDE"
for item in "${EXCLUDES[@]}"; do
    RSYNC_OPTS="$RSYNC_OPTS --exclude=$item"
done

SSH_CMD="ssh -p ${REMOTE_PORT}"

# Resolve theme path
THEME_DIR="$SCRIPT_DIR/../app/web/app/themes"
THEME_SLUG=$(ls "$THEME_DIR" 2>/dev/null | head -1)

if [ -z "$THEME_SLUG" ]; then
    echo "Error: No theme found in $THEME_DIR"
    exit 1
fi

LOCAL_THEME_PATH="$THEME_DIR/$THEME_SLUG"

sync_files() {
    echo "$(date '+%H:%M:%S') Syncing..."
    # shellcheck disable=SC2086
    rsync $RSYNC_OPTS -e "$SSH_CMD" \
        "$LOCAL_THEME_PATH/" \
        "$REMOTE_USER@$REMOTE_HOST:$REMOTE_THEME_PATH/"
    echo "$(date '+%H:%M:%S') Done"
}

echo "Watching: $LOCAL_THEME_PATH"
echo "Target:   $REMOTE_USER@$REMOTE_HOST:$REMOTE_THEME_PATH"
echo "Press Ctrl+C to stop"
echo ""

# Initial sync
sync_files

# Watch for changes based on OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    if ! command -v fswatch &>/dev/null; then
        echo "Error: fswatch is required on macOS. Install with: brew install fswatch"
        exit 1
    fi
    fswatch -o -r --latency 0.5 \
        --exclude "\.git" --exclude "node_modules" --exclude "\.DS_Store" \
        "$LOCAL_THEME_PATH" | while read -r _; do
        sync_files
    done
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    if ! command -v inotifywait &>/dev/null; then
        echo "Error: inotify-tools is required on Linux. Install with: sudo apt install inotify-tools"
        exit 1
    fi
    inotifywait -m -r -e modify,create,delete,move \
        --exclude "(\.git|node_modules)" \
        "$LOCAL_THEME_PATH" | while read -r _; do
        sleep 0.5
        sync_files
    done
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
    echo "On Windows, using polling mode (2s interval)..."
    while true; do
        sleep 2
        sync_files
    done
else
    echo "Warning: Unknown OS ($OSTYPE). Using polling mode (2s interval)..."
    while true; do
        sleep 2
        sync_files
    done
fi
