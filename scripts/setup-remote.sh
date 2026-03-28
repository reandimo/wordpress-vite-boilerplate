#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/_env.sh"
source "$SCRIPT_DIR/_ui.sh"

SYNC_PROTOCOL="${SYNC_PROTOCOL:-ssh}"
REMOTE_PORT="${REMOTE_PORT:-$([ "$SYNC_PROTOCOL" = "ftp" ] && echo 21 || echo 22)}"

# ── Banner ───────────────────────────────────────────────────
ui_banner "Remote Sync — Preflight Check" "Verifying dependencies and connection"

# ── System Info ──────────────────────────────────────────────
ui_section "System" "🖥"
ui_key_value "OS:" "$(detect_os_label)"
ui_key_value "Protocol:" "${C_BRIGHT_CYAN}${C_BOLD}${SYNC_PROTOCOL}${C_RESET}"
ui_key_value "Host:" "${REMOTE_HOST:-${C_DIM}not set${C_RESET}}"
ui_key_value "User:" "${REMOTE_USER:-${C_DIM}not set${C_RESET}}"
ui_key_value "Port:" "$REMOTE_PORT"

# ── Dependencies ─────────────────────────────────────────────
ui_section "Dependencies" "🔧"

MISSING=0

if [ "$SYNC_PROTOCOL" = "ftp" ]; then
    if command -v lftp &>/dev/null; then
        ver=$(lftp --version 2>&1 | head -1 | sed 's/.*Version //' | sed 's/ .*//' | tr -d '\r')
        ui_ok "lftp" "$ver"
    else
        ui_fail "lftp — required for FTP sync"
        case "$OSTYPE" in
            msys*|cygwin*)  ui_detail "Install: ${C_YELLOW}choco install lftp${C_RESET}" ;;
            darwin*)        ui_detail "Install: ${C_YELLOW}brew install lftp${C_RESET}" ;;
            *)              ui_detail "Install: ${C_YELLOW}sudo apt install lftp${C_RESET}" ;;
        esac
        MISSING=1
    fi
else
    if command -v rsync &>/dev/null; then
        ver=$(rsync --version 2>&1 | head -1 | sed 's/.*version //' | sed 's/ .*//' | tr -d '\r')
        ui_ok "rsync" "$ver"
    else
        ui_fail "rsync — required for SSH sync"
        case "$OSTYPE" in
            msys*|cygwin*)  ui_detail "Install: ${C_YELLOW}choco install rsync${C_RESET}" ;;
            darwin*)        ui_detail "Install: ${C_YELLOW}brew install rsync${C_RESET}" ;;
            *)              ui_detail "Install: ${C_YELLOW}sudo apt install rsync${C_RESET}" ;;
        esac
        MISSING=1
    fi

    if command -v ssh &>/dev/null; then
        ui_ok "ssh"
    else
        ui_fail "ssh — required for remote connection"
        MISSING=1
    fi
fi

# File watcher
case "$OSTYPE" in
    darwin*)
        if command -v fswatch &>/dev/null; then
            ui_ok "fswatch"
        else
            ui_warn "fswatch not found ${C_DIM}(falls back to polling)${C_RESET}"
            ui_detail "Install: ${C_YELLOW}brew install fswatch${C_RESET}"
        fi
        ;;
    linux-gnu*)
        if command -v inotifywait &>/dev/null; then
            ui_ok "inotifywait"
        else
            ui_warn "inotify-tools not found ${C_DIM}(falls back to polling)${C_RESET}"
            ui_detail "Install: ${C_YELLOW}sudo apt install inotify-tools${C_RESET}"
        fi
        ;;
    *)
        ui_info "File watcher: polling mode ${C_DIM}(native on Windows)${C_RESET}"
        ;;
esac

# ── Tunnel Tools (optional) ─────────────────────────────────
ui_section "Tunnel Tools" "🚇"

if command -v cloudflared &>/dev/null; then
    ui_ok "cloudflared"
elif command -v ngrok &>/dev/null; then
    ui_ok "ngrok"
else
    ui_skip "No tunnel tool installed (optional)"
    ui_detail "Install: ${C_YELLOW}choco install cloudflared${C_RESET}  or  ${C_YELLOW}choco install ngrok${C_RESET}"
fi

# ── Connection Test ──────────────────────────────────────────
ui_section "Connection Test" "🌐"

if [ -n "${REMOTE_HOST:-}" ] && [ -n "${REMOTE_USER:-}" ]; then
    if [ "$SYNC_PROTOCOL" = "ftp" ]; then
        ui_spinner_start "Connecting to $REMOTE_HOST:$REMOTE_PORT via FTP..."
        if command -v lftp &>/dev/null; then
            FTP_OUTPUT=$(lftp -u "$REMOTE_USER","${REMOTE_PASSWORD:-}" -p "$REMOTE_PORT" "$REMOTE_HOST" -e "set ssl:verify-certificate no; set net:timeout 10; set net:max-retries 1; ls; quit" 2>&1) && FTP_OK=true || FTP_OK=false
            ui_spinner_stop
            if [ "$FTP_OK" = "true" ]; then
                ui_ok "FTP connection successful"
            else
                ui_fail "FTP connection failed"
                # Clean up error output
                CLEAN_ERROR=$(echo "$FTP_OUTPUT" | tr -d '\r' | head -3)
                ui_detail "Error: $CLEAN_ERROR"
                echo ""
                ui_info "Check your .env settings:"
                ui_detail "REMOTE_HOST=$REMOTE_HOST"
                ui_detail "REMOTE_PORT=$REMOTE_PORT"
                ui_detail "REMOTE_USER=$REMOTE_USER"
                ui_detail "REMOTE_PASSWORD=****"
            fi
        else
            ui_spinner_stop
            ui_skip "lftp not installed — cannot test"
        fi
    else
        ui_spinner_start "Connecting to $REMOTE_HOST:$REMOTE_PORT via SSH..."
        if ssh -p "$REMOTE_PORT" -o ConnectTimeout=5 -o BatchMode=yes "$REMOTE_USER@$REMOTE_HOST" "echo ok" &>/dev/null; then
            ui_spinner_stop
            ui_ok "SSH connection successful"
        else
            ui_spinner_stop
            ui_fail "SSH connection failed"
            echo ""
            ui_info "Set up your SSH key:"
            ui_step "${C_DIM}ssh-keygen -t ed25519${C_RESET}"
            ui_step "${C_DIM}ssh-copy-id -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST${C_RESET}"
        fi
    fi
else
    ui_warn "REMOTE_HOST or REMOTE_USER not set in .env — skipped"
fi

# ── Result ───────────────────────────────────────────────────
if [ "$MISSING" -eq 0 ]; then
    ui_success_box "All dependencies installed. Ready to sync!"
    echo -e "  ${C_DIM}Run ${C_BRIGHT_WHITE}npm run sync${C_DIM} to start watching and syncing.${C_RESET}"
    echo ""
else
    ui_error_box "Missing dependencies. Install them and try again."
    exit 1
fi
