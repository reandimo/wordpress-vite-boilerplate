#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/_env.sh"

SYNC_PROTOCOL="${SYNC_PROTOCOL:-ssh}"

echo "Checking remote sync dependencies..."
echo "Protocol: $SYNC_PROTOCOL"
echo ""

MISSING=0

if [ "$SYNC_PROTOCOL" = "ftp" ]; then
    # FTP mode: lftp
    if command -v lftp &>/dev/null; then
        echo "[OK] lftp $(lftp --version 2>&1 | head -1)"
    else
        echo "[MISSING] lftp — required for FTP sync"
        if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
            echo "  Install: choco install lftp"
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            echo "  Install: brew install lftp"
        else
            echo "  Install: sudo apt install lftp"
        fi
        MISSING=1
    fi
else
    # SSH mode: rsync + ssh
    if command -v rsync &>/dev/null; then
        echo "[OK] rsync $(rsync --version 2>&1 | head -1)"
    else
        echo "[MISSING] rsync — required for SSH sync"
        if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
            echo "  Install: choco install rsync"
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            echo "  Install: brew install rsync"
        else
            echo "  Install: sudo apt install rsync"
        fi
        MISSING=1
    fi

    if command -v ssh &>/dev/null; then
        echo "[OK] ssh"
    else
        echo "[MISSING] ssh — required for remote connection"
        MISSING=1
    fi
fi

# File watcher
if [[ "$OSTYPE" == "darwin"* ]]; then
    if command -v fswatch &>/dev/null; then
        echo "[OK] fswatch"
    else
        echo "[WARN] fswatch not found — install with: brew install fswatch (falls back to polling)"
    fi
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    if command -v inotifywait &>/dev/null; then
        echo "[OK] inotifywait"
    else
        echo "[WARN] inotify-tools not found — install with: sudo apt install inotify-tools (falls back to polling)"
    fi
else
    echo "[INFO] Windows — sync-watch uses polling mode"
fi

# Tunnel tools (optional)
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

# Test connection
echo ""
if [ -n "${REMOTE_HOST:-}" ] && [ -n "${REMOTE_USER:-}" ]; then
    REMOTE_PORT="${REMOTE_PORT:-$([ "$SYNC_PROTOCOL" = "ftp" ] && echo 21 || echo 22)}"

    if [ "$SYNC_PROTOCOL" = "ftp" ]; then
        echo "Testing FTP connection to $REMOTE_USER@$REMOTE_HOST:$REMOTE_PORT..."
        if command -v lftp &>/dev/null; then
            if lftp -u "$REMOTE_USER","${REMOTE_PASSWORD:-}" -p "$REMOTE_PORT" "$REMOTE_HOST" -e "ls; quit" &>/dev/null; then
                echo "[OK] FTP connection successful"
            else
                echo "[FAIL] Cannot connect via FTP. Check host, user, password, and port."
            fi
        else
            echo "[SKIP] lftp not installed — cannot test FTP connection"
        fi
    else
        echo "Testing SSH connection to $REMOTE_USER@$REMOTE_HOST:$REMOTE_PORT..."
        if ssh -p "$REMOTE_PORT" -o ConnectTimeout=5 -o BatchMode=yes "$REMOTE_USER@$REMOTE_HOST" "echo 'SSH connection OK'" 2>/dev/null; then
            echo "[OK] SSH connection successful"
        else
            echo "[FAIL] Cannot connect via SSH. Ensure your SSH key is set up:"
            echo "  ssh-keygen -t ed25519  (if you don't have a key)"
            echo "  ssh-copy-id -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST"
        fi
    fi
else
    echo "REMOTE_HOST or REMOTE_USER not set in .env — skipping connection test"
fi

echo ""
if [ "$MISSING" -eq 0 ]; then
    echo "All required dependencies are installed. Ready to sync!"
else
    echo "Some dependencies are missing. Install them and run this script again."
    exit 1
fi
