#!/usr/bin/env bash
# Shared environment for sync scripts.
# Sources .env and extends PATH on Windows so tools installed via
# Chocolatey, Scoop, or default system paths are found by Git Bash.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"

# Windows: Git Bash doesn't inherit all system PATH entries.
# Add common tool locations so rsync, ssh, cloudflared, etc. are found.
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    WIN_PATHS=(
        "/c/ProgramData/chocolatey/bin"
        "/c/ProgramData/chocolatey/lib/rsync/tools/bin"
        "$HOME/scoop/shims"
        "/c/Program Files/Git/usr/bin"
        "/c/Windows/System32/OpenSSH"
    )
    for p in "${WIN_PATHS[@]}"; do
        [[ -d "$p" ]] && case ":$PATH:" in *":$p:"*) ;; *) export PATH="$p:$PATH" ;; esac
    done
fi

# Load .env if it exists
if [ -f "$ENV_FILE" ]; then
    set -a
    # shellcheck source=/dev/null
    source "$ENV_FILE"
    set +a
fi
