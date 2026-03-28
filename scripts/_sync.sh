#!/usr/bin/env bash
# Shared sync functions for SSH (rsync) and FTP (lftp) protocols.
# Requires _env.sh and _ui.sh to be sourced first.
# @author Renan Diaz <https://reandimo.dev>

SYNC_PROTOCOL="${SYNC_PROTOCOL:-ssh}"
REMOTE_PORT="${REMOTE_PORT:-$([ "$SYNC_PROTOCOL" = "ftp" ] && echo 21 || echo 22)}"
SYNC_EXCLUDE="${SYNC_EXCLUDE:-.git,node_modules,.DS_Store,*.log,.env,public/hot}"
SYNC_DELETE="${SYNC_DELETE:-false}"

# Resolve local theme path (absolute, no ".." — required for lftp lcd)
THEME_DIR="$(cd "$SCRIPT_DIR/../app/web/app/themes" && pwd)"
THEME_SLUG=$(ls "$THEME_DIR" 2>/dev/null | grep -v '^\.' | grep -v '.gitkeep' | head -1)
LOCAL_THEME_PATH="$THEME_DIR/$THEME_SLUG"

# lftp on Windows (Chocolatey) needs Windows-style paths, not /c/...
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]] && command -v cygpath &>/dev/null; then
    LFTP_LOCAL_PATH="$(cygpath -w "$LOCAL_THEME_PATH")"
else
    LFTP_LOCAL_PATH="$LOCAL_THEME_PATH"
fi

if [ -z "$THEME_SLUG" ] || [ ! -d "$LOCAL_THEME_PATH" ]; then
    ui_error_box "No theme found in $THEME_DIR"
    exit 1
fi

# ── Build helpers ────────────────────────────────────────────

_build_lftp_excludes() {
    local excludes=""
    IFS=',' read -ra ITEMS <<< "$SYNC_EXCLUDE"
    for item in "${ITEMS[@]}"; do
        # Convert glob patterns to lftp-compatible regex:
        # *.log  -> \.log$
        # .git   -> ^\.git
        # node_modules -> ^node_modules
        local pattern="$item"
        if [[ "$pattern" == \*.* ]]; then
            # Glob like *.log -> regex \.ext$
            pattern=$(echo "$pattern" | sed 's/\*//' | sed 's/\./\\./g')
            pattern="${pattern}$"
        fi
        excludes="$excludes --exclude $pattern"
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

        printf "  %s↑%s %s Uploading via FTP...\n" "$C_CYAN" "$C_RESET" "$ts"
        local file_count=0
        # shellcheck disable=SC2086
        lftp -u "$REMOTE_USER","$REMOTE_PASSWORD" -p "$REMOTE_PORT" "$REMOTE_HOST" -e "
            set ssl:verify-certificate no;
            lcd "$LFTP_LOCAL_PATH";
            cd $REMOTE_THEME_PATH;
            mirror --reverse --no-perms --verbose=1 $delete_flag $excludes;
            quit
        " 2>&1 | while IFS= read -r line; do
            line="${line//$'\r'/}"
            [ -z "$line" ] && continue
            # Parse lftp verbose output for file transfers
            if [[ "$line" == *"Transferring"* ]] || [[ "$line" == *"Removing"* ]]; then
                printf "    %s%s%s\n" "$C_DIM" "$line" "$C_RESET"
            elif [[ "$line" == *"new:"* ]] || [[ "$line" == *"modified:"* ]]; then
                printf "    %s%s%s\n" "$C_DIM" "$line" "$C_RESET"
            elif [[ "$line" == *".php"* ]] || [[ "$line" == *".scss"* ]] || [[ "$line" == *".ts"* ]] || [[ "$line" == *".js"* ]] || [[ "$line" == *".html"* ]] || [[ "$line" == *".json"* ]] || [[ "$line" == *".css"* ]]; then
                # Show individual file uploads with icon
                local filename="${line##*/}"
                filename="${filename%% *}"
                printf "    %s⬆%s  %s%s%s\n" "$C_CYAN" "$C_RESET" "$C_BRIGHT_WHITE" "$filename" "$C_RESET"
            elif [[ "$line" == *"Total:"* ]] || [[ "$line" == *"bytes transferred"* ]]; then
                printf "    %s%s%s\n" "$C_DIM" "$line" "$C_RESET"
            fi
        done
    else
        local rsync_opts
        rsync_opts=$(_build_rsync_opts)
        local ssh_cmd="ssh -p ${REMOTE_PORT}"

        printf "  %s↑%s %s Uploading via rsync...\n" "$C_CYAN" "$C_RESET" "$ts"
        # shellcheck disable=SC2086
        rsync $rsync_opts -e "$ssh_cmd" \
            "$LOCAL_THEME_PATH/" \
            "$REMOTE_USER@$REMOTE_HOST:$REMOTE_THEME_PATH/" 2>&1 | while IFS= read -r line; do
            line="${line//$'\r'/}"
            [ -z "$line" ] && continue
            # rsync lists transferred files — show them with icons
            if [[ "$line" == *"/"* ]] && [[ "$line" != *"sending"* ]] && [[ "$line" != *"sent "* ]] && [[ "$line" != *"total size"* ]] && [[ "$line" != *"building"* ]]; then
                printf "    %s⬆%s  %s%s%s\n" "$C_CYAN" "$C_RESET" "$C_BRIGHT_WHITE" "$line" "$C_RESET"
            elif [[ "$line" == *"sent "* ]] || [[ "$line" == *"total size"* ]]; then
                printf "    %s%s%s\n" "$C_DIM" "$line" "$C_RESET"
            fi
        done
    fi

    ts=$(ui_timestamp)
    printf "  %s%s✓%s %s Sync complete\n" "$C_GREEN" "$C_BOLD" "$C_RESET" "$ts"
}

sync_pull() {
    local ts
    ts=$(ui_timestamp)

    if [ "$SYNC_PROTOCOL" = "ftp" ]; then
        local excludes
        excludes=$(_build_lftp_excludes)

        printf "  %s↓%s %s Downloading via FTP...\n" "$C_MAGENTA" "$C_RESET" "$ts"
        # shellcheck disable=SC2086
        lftp -u "$REMOTE_USER","$REMOTE_PASSWORD" -p "$REMOTE_PORT" "$REMOTE_HOST" -e "
            set ssl:verify-certificate no;
            lcd "$LFTP_LOCAL_PATH";
            cd $REMOTE_THEME_PATH;
            mirror --no-perms --verbose=1 $excludes;
            quit
        " 2>&1 | while IFS= read -r line; do
            line="${line//$'\r'/}"
            [ -z "$line" ] && continue
            if [[ "$line" == *".php"* ]] || [[ "$line" == *".scss"* ]] || [[ "$line" == *".ts"* ]] || [[ "$line" == *".js"* ]] || [[ "$line" == *".html"* ]] || [[ "$line" == *".json"* ]] || [[ "$line" == *".css"* ]]; then
                local filename="${line##*/}"
                filename="${filename%% *}"
                printf "    %s⬇%s  %s%s%s\n" "$C_MAGENTA" "$C_RESET" "$C_BRIGHT_WHITE" "$filename" "$C_RESET"
            elif [[ "$line" == *"Total:"* ]] || [[ "$line" == *"bytes transferred"* ]]; then
                printf "    %s%s%s\n" "$C_DIM" "$line" "$C_RESET"
            else
                printf "    %s%s%s\n" "$C_DIM" "$line" "$C_RESET"
            fi
        done
    else
        local rsync_opts="-avz --compress --checksum"
        IFS=',' read -ra ITEMS <<< "$SYNC_EXCLUDE"
        for item in "${ITEMS[@]}"; do
            rsync_opts="$rsync_opts --exclude=$item"
        done
        local ssh_cmd="ssh -p ${REMOTE_PORT}"

        printf "  %s↓%s %s Downloading via rsync...\n" "$C_MAGENTA" "$C_RESET" "$ts"
        # shellcheck disable=SC2086
        rsync $rsync_opts -e "$ssh_cmd" \
            "$REMOTE_USER@$REMOTE_HOST:$REMOTE_THEME_PATH/" \
            "$LOCAL_THEME_PATH/" 2>&1 | while IFS= read -r line; do
            line="${line//$'\r'/}"
            [ -z "$line" ] && continue
            if [[ "$line" == *"/"* ]] && [[ "$line" != *"receiving"* ]] && [[ "$line" != *"sent "* ]] && [[ "$line" != *"total size"* ]]; then
                printf "    %s⬇%s  %s%s%s\n" "$C_MAGENTA" "$C_RESET" "$C_BRIGHT_WHITE" "$line" "$C_RESET"
            elif [[ "$line" == *"sent "* ]] || [[ "$line" == *"total size"* ]]; then
                printf "    %s%s%s\n" "$C_DIM" "$line" "$C_RESET"
            fi
        done
    fi

    ts=$(ui_timestamp)
    printf "  %s%s✓%s %s Pull complete\n" "$C_GREEN" "$C_BOLD" "$C_RESET" "$ts"
}
