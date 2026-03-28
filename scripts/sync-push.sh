#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: .env file not found. Copy .env.example to .env first."
    exit 1
fi

# shellcheck source=/dev/null
source "$ENV_FILE"

REMOTE_PORT="${REMOTE_PORT:-22}"
SYNC_EXCLUDE="${SYNC_EXCLUDE:-.git,node_modules,.DS_Store,*.log,.env,public/hot}"

RSYNC_OPTS="-avz --compress --delete --checksum"

IFS=',' read -ra EXCLUDES <<< "$SYNC_EXCLUDE"
for item in "${EXCLUDES[@]}"; do
    RSYNC_OPTS="$RSYNC_OPTS --exclude=$item"
done

SSH_CMD="ssh -p ${REMOTE_PORT}"

THEME_DIR="$SCRIPT_DIR/../app/web/app/themes"
THEME_SLUG=$(ls "$THEME_DIR" 2>/dev/null | head -1)
LOCAL_THEME_PATH="$THEME_DIR/$THEME_SLUG"

echo "Pushing theme to $REMOTE_USER@$REMOTE_HOST:$REMOTE_THEME_PATH..."
# shellcheck disable=SC2086
rsync $RSYNC_OPTS -e "$SSH_CMD" \
    "$LOCAL_THEME_PATH/" \
    "$REMOTE_USER@$REMOTE_HOST:$REMOTE_THEME_PATH/"
echo "Push complete"
