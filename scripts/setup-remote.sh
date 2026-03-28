#!/usr/bin/env bash
set -euo pipefail

echo "Checking remote sync dependencies..."
echo ""

MISSING=0

# Check rsync
if command -v rsync &>/dev/null; then
    echo "[OK] rsync $(rsync --version 2>&1 | head -1)"
else
    echo "[MISSING] rsync — required for file sync"
    MISSING=1
fi

# Check SSH
if command -v ssh &>/dev/null; then
    echo "[OK] ssh"
else
    echo "[MISSING] ssh — required for remote connection"
    MISSING=1
fi

# Check file watcher
if [[ "$OSTYPE" == "darwin"* ]]; then
    if command -v fswatch &>/dev/null; then
        echo "[OK] fswatch"
    else
        echo "[MISSING] fswatch — install with: brew install fswatch"
        MISSING=1
    fi
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    if command -v inotifywait &>/dev/null; then
        echo "[OK] inotifywait"
    else
        echo "[MISSING] inotify-tools — install with: sudo apt install inotify-tools"
        MISSING=1
    fi
else
    echo "[INFO] Windows detected — sync-watch will use polling mode"
fi

# Check tunnel tools (optional)
echo ""
echo "Optional tunnel tools:"
if command -v cloudflared &>/dev/null; then
    echo "[OK] cloudflared"
else
    echo "[--] cloudflared not installed (optional)"
fi
if command -v ngrok &>/dev/null; then
    echo "[OK] ngrok"
else
    echo "[--] ngrok not installed (optional)"
fi

# Test SSH connection
echo ""
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"

if [ -f "$ENV_FILE" ]; then
    # shellcheck source=/dev/null
    source "$ENV_FILE"
    if [ -n "${REMOTE_HOST:-}" ] && [ -n "${REMOTE_USER:-}" ]; then
        REMOTE_PORT="${REMOTE_PORT:-22}"
        echo "Testing SSH connection to $REMOTE_USER@$REMOTE_HOST:$REMOTE_PORT..."
        if ssh -p "$REMOTE_PORT" -o ConnectTimeout=5 "$REMOTE_USER@$REMOTE_HOST" "echo 'SSH connection OK'" 2>/dev/null; then
            echo "[OK] SSH connection successful"
        else
            echo "[FAIL] Cannot connect. Ensure your SSH key is set up:"
            echo "  ssh-copy-id -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST"
        fi
    else
        echo "REMOTE_HOST or REMOTE_USER not set in .env — skipping SSH test"
    fi
else
    echo ".env file not found — skipping SSH test"
fi

echo ""
if [ "$MISSING" -eq 0 ]; then
    echo "All required dependencies are installed."
else
    echo "Some dependencies are missing. Install them and run this script again."
    exit 1
fi
