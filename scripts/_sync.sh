#!/usr/bin/env bash
# Shared sync functions for SSH (rsync) and FTP (lftp) protocols.

SYNC_PROTOCOL="${SYNC_PROTOCOL:-ssh}"
REMOTE_PORT="${REMOTE_PORT:-$([ "$SYNC_PROTOCOL" = "ftp" ] && echo 21 || echo 22)}"
SYNC_EXCLUDE="${SYNC_EXCLUDE:-.git,node_modules,.DS_Store,*.log,.env,public/hot}"
SYNC_DELETE="${SYNC_DELETE:-false}"

# Resolve local theme path
THEME_DIR="$SCRIPT_DIR/../app/web/app/themes"
# Find theme dir: skip .gitkeep and hidden files
THEME_SLUG=$(ls "$THEME_DIR" 2>/dev/null | grep -v '^\.' | grep -v '.gitkeep' | head -1)
LOCAL_THEME_PATH="$THEME_DIR/$THEME_SLUG"

if [ -z "$THEME_SLUG" ] || [ ! -d "$LOCAL_THEME_PATH" ]; then
    echo "Error: No theme found in $THEME_DIR"
    exit 1
fi

# Build exclude pattern for lftp
_build_lftp_excludes() {
    local excludes=""
    IFS=',' read -ra ITEMS <<< "$SYNC_EXCLUDE"
    for item in "${ITEMS[@]}"; do
        excludes="$excludes --exclude $item"
    done
    echo "$excludes"
}

# Build rsync options
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

sync_push() {
    if [ "$SYNC_PROTOCOL" = "ftp" ]; then
        local delete_flag=""
        if [ "$SYNC_DELETE" = "true" ]; then
            delete_flag="--delete"
        fi
        local excludes
        excludes=$(_build_lftp_excludes)
        echo "$(date '+%H:%M:%S') Uploading via FTP..."
        # shellcheck disable=SC2086
        lftp -u "$REMOTE_USER","$REMOTE_PASSWORD" -p "$REMOTE_PORT" "$REMOTE_HOST" -e "
            set ssl:verify-certificate no;
            mirror --reverse --verbose --no-perms $delete_flag $excludes \
                \"$LOCAL_THEME_PATH\" \"$REMOTE_THEME_PATH\";
            quit
        "
    else
        local rsync_opts
        rsync_opts=$(_build_rsync_opts)
        local ssh_cmd="ssh -p ${REMOTE_PORT}"
        echo "$(date '+%H:%M:%S') Uploading via rsync..."
        # shellcheck disable=SC2086
        rsync $rsync_opts -e "$ssh_cmd" \
            "$LOCAL_THEME_PATH/" \
            "$REMOTE_USER@$REMOTE_HOST:$REMOTE_THEME_PATH/"
    fi
    echo "$(date '+%H:%M:%S') Done"
}

sync_pull() {
    if [ "$SYNC_PROTOCOL" = "ftp" ]; then
        local excludes
        excludes=$(_build_lftp_excludes)
        echo "Downloading via FTP..."
        # shellcheck disable=SC2086
        lftp -u "$REMOTE_USER","$REMOTE_PASSWORD" -p "$REMOTE_PORT" "$REMOTE_HOST" -e "
            set ssl:verify-certificate no;
            mirror --verbose --no-perms $excludes \
                \"$REMOTE_THEME_PATH\" \"$LOCAL_THEME_PATH\";
            quit
        "
    else
        local rsync_opts="-avz --compress --checksum"
        IFS=',' read -ra ITEMS <<< "$SYNC_EXCLUDE"
        for item in "${ITEMS[@]}"; do
            rsync_opts="$rsync_opts --exclude=$item"
        done
        local ssh_cmd="ssh -p ${REMOTE_PORT}"
        echo "Downloading via rsync..."
        # shellcheck disable=SC2086
        rsync $rsync_opts -e "$ssh_cmd" \
            "$REMOTE_USER@$REMOTE_HOST:$REMOTE_THEME_PATH/" \
            "$LOCAL_THEME_PATH/"
    fi
    echo "Done"
}
