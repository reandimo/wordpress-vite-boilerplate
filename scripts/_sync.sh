#!/usr/bin/env bash
# Shared sync functions for SSH (rsync) and FTP (lftp) protocols.
# Requires _env.sh and _ui.sh to be sourced first.
# @author Renan Diaz <https://reandimo.dev>

SYNC_PROTOCOL="${SYNC_PROTOCOL:-ssh}"
REMOTE_PORT="${REMOTE_PORT:-$([ "$SYNC_PROTOCOL" = "ftp" ] && echo 21 || echo 22)}"
SYNC_EXCLUDE="${SYNC_EXCLUDE:-.git,node_modules,.DS_Store,*.log,.env,public/hot}"
SYNC_DELETE="${SYNC_DELETE:-false}"

# Resolve local theme path
THEME_DIR="$SCRIPT_DIR/../app/web/app/themes"
THEME_SLUG=$(ls "$THEME_DIR" 2>/dev/null | grep -v '^\.' | grep -v '.gitkeep' | head -1)
LOCAL_THEME_PATH="$THEME_DIR/$THEME_SLUG"

if [ -z "$THEME_SLUG" ] || [ ! -d "$LOCAL_THEME_PATH" ]; then
    ui_error_box "No theme found in $THEME_DIR"
    exit 1
fi

# ── Build helpers ────────────────────────────────────────────

_build_lftp_excludes() {
    local excludes=""
    IFS=',' read -ra ITEMS <<< "$SYNC_EXCLUDE"
    for item in "${ITEMS[@]}"; do
        excludes="$excludes --exclude $item"
    done
    echo "$excludes"
}

_build_rsync_opts() {
    local opts="-avz --compress --checksum"
    if [ "$SYNC_DELETE" = "true" ]; then
        opts="$opts --delete"
    fi
    IFS=',' read -ra ITEMS <<< "$SYNC_EXCLUDE"
    for item in "${ITEMS[@]}"; do
        opts="$opts --exclude=$item"
    done
    echo "$opts"
}

# ── Sync functions ───────────────────────────────────────────

sync_push() {
    local ts
    ts=$(ui_timestamp)

    if [ "$SYNC_PROTOCOL" = "ftp" ]; then
        local delete_flag=""
        [ "$SYNC_DELETE" = "true" ] && delete_flag="--delete"
        local excludes
        excludes=$(_build_lftp_excludes)

        echo -e "  ${C_CYAN}↑${C_RESET} ${ts} Uploading via FTP..."
        # shellcheck disable=SC2086
        lftp -u "$REMOTE_USER","$REMOTE_PASSWORD" -p "$REMOTE_PORT" "$REMOTE_HOST" -e "
            set ssl:verify-certificate no;
            mirror --reverse --no-perms $delete_flag $excludes \
                \"$LOCAL_THEME_PATH\" \"$REMOTE_THEME_PATH\";
            quit
        " 2>&1 | while IFS= read -r line; do
            line="${line//$'\r'/}"
            [ -n "$line" ] && echo -e "    ${C_DIM}${line}${C_RESET}"
        done
    else
        local rsync_opts
        rsync_opts=$(_build_rsync_opts)
        local ssh_cmd="ssh -p ${REMOTE_PORT}"

        echo -e "  ${C_CYAN}↑${C_RESET} ${ts} Uploading via rsync..."
        # shellcheck disable=SC2086
        rsync $rsync_opts -e "$ssh_cmd" \
            "$LOCAL_THEME_PATH/" \
            "$REMOTE_USER@$REMOTE_HOST:$REMOTE_THEME_PATH/" 2>&1 | while IFS= read -r line; do
            line="${line//$'\r'/}"
            [ -n "$line" ] && echo -e "    ${C_DIM}${line}${C_RESET}"
        done
    fi

    ts=$(ui_timestamp)
    echo -e "  ${C_GREEN}${C_BOLD}✓${C_RESET} ${ts} Sync complete"
}

sync_pull() {
    local ts
    ts=$(ui_timestamp)

    if [ "$SYNC_PROTOCOL" = "ftp" ]; then
        local excludes
        excludes=$(_build_lftp_excludes)

        echo -e "  ${C_MAGENTA}↓${C_RESET} ${ts} Downloading via FTP..."
        # shellcheck disable=SC2086
        lftp -u "$REMOTE_USER","$REMOTE_PASSWORD" -p "$REMOTE_PORT" "$REMOTE_HOST" -e "
            set ssl:verify-certificate no;
            mirror --no-perms $excludes \
                \"$REMOTE_THEME_PATH\" \"$LOCAL_THEME_PATH\";
            quit
        " 2>&1 | while IFS= read -r line; do
            line="${line//$'\r'/}"
            [ -n "$line" ] && echo -e "    ${C_DIM}${line}${C_RESET}"
        done
    else
        local rsync_opts="-avz --compress --checksum"
        IFS=',' read -ra ITEMS <<< "$SYNC_EXCLUDE"
        for item in "${ITEMS[@]}"; do
            rsync_opts="$rsync_opts --exclude=$item"
        done
        local ssh_cmd="ssh -p ${REMOTE_PORT}"

        echo -e "  ${C_MAGENTA}↓${C_RESET} ${ts} Downloading via rsync..."
        # shellcheck disable=SC2086
        rsync $rsync_opts -e "$ssh_cmd" \
            "$REMOTE_USER@$REMOTE_HOST:$REMOTE_THEME_PATH/" \
            "$LOCAL_THEME_PATH/" 2>&1 | while IFS= read -r line; do
            line="${line//$'\r'/}"
            [ -n "$line" ] && echo -e "    ${C_DIM}${line}${C_RESET}"
        done
    fi

    ts=$(ui_timestamp)
    echo -e "  ${C_GREEN}${C_BOLD}✓${C_RESET} ${ts} Pull complete"
}
