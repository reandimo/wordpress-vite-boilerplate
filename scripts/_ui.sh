#!/usr/bin/env bash
# Shared UI functions for beautiful terminal output.
# Source this after _env.sh in any script.
# @author Renan Diaz <https://reandimo.dev>

# ── ANSI Colors (using $'...' so escapes are interpreted at assignment) ──
C_RESET=$'\033[0m'
C_BOLD=$'\033[1m'
C_DIM=$'\033[2m'
C_ITALIC=$'\033[3m'
C_UNDERLINE=$'\033[4m'

C_RED=$'\033[31m'
C_GREEN=$'\033[32m'
C_YELLOW=$'\033[33m'
C_BLUE=$'\033[34m'
C_MAGENTA=$'\033[35m'
C_CYAN=$'\033[36m'
C_WHITE=$'\033[37m'
C_BRIGHT_BLACK=$'\033[90m'
C_BRIGHT_WHITE=$'\033[97m'
C_BRIGHT_CYAN=$'\033[96m'
C_BRIGHT_GREEN=$'\033[92m'
C_BRIGHT_YELLOW=$'\033[93m'
C_BRIGHT_MAGENTA=$'\033[95m'

# ── Print helpers ────────────────────────────────────────────

ui_banner() {
    local title="$1"
    local subtitle="${2:-}"
    local width=54
    echo ""
    printf "  %s%s╔%s╗%s\n" "$C_CYAN" "$C_BOLD" "$(printf '═%.0s' $(seq 1 $width))" "$C_RESET"
    local pad_left=$(( (width - ${#title}) / 2 ))
    local pad_right=$(( width - ${#title} - pad_left ))
    printf "  %s%s║%s%*s%s%s%s%*s%s%s║%s\n" "$C_CYAN" "$C_BOLD" "$C_RESET" "$pad_left" "" "$C_BRIGHT_WHITE" "$C_BOLD" "$title" "$pad_right" "" "$C_CYAN" "$C_BOLD" "$C_RESET"
    if [ -n "$subtitle" ]; then
        local spad_left=$(( (width - ${#subtitle}) / 2 ))
        local spad_right=$(( width - ${#subtitle} - spad_left ))
        printf "  %s%s║%s%*s%s%s%*s%s%s║%s\n" "$C_CYAN" "$C_BOLD" "$C_RESET" "$spad_left" "" "$C_DIM" "$subtitle" "$spad_right" "" "$C_CYAN" "$C_BOLD" "$C_RESET"
    fi
    printf "  %s%s╚%s╝%s\n" "$C_CYAN" "$C_BOLD" "$(printf '═%.0s' $(seq 1 $width))" "$C_RESET"
    echo ""
}

ui_section() {
    local title="$1"
    local icon="${2:-◆}"
    echo ""
    printf "  %s%s%s %s%s\n" "$C_CYAN" "$C_BOLD" "$icon" "$title" "$C_RESET"
    printf "  %s%s%s\n" "$C_DIM" "$(printf '─%.0s' $(seq 1 50))" "$C_RESET"
}

ui_ok() {
    local text="$1"
    local detail="${2:-}"
    if [ -n "$detail" ]; then
        printf "  %s%s✓%s %s %s(%s)%s\n" "$C_GREEN" "$C_BOLD" "$C_RESET" "$text" "$C_DIM" "$detail" "$C_RESET"
    else
        printf "  %s%s✓%s %s\n" "$C_GREEN" "$C_BOLD" "$C_RESET" "$text"
    fi
}

ui_fail() {
    printf "  %s%s✗%s %s\n" "$C_RED" "$C_BOLD" "$C_RESET" "$1"
}

ui_warn() {
    printf "  %s%s⚠%s %s\n" "$C_YELLOW" "$C_BOLD" "$C_RESET" "$1"
}

ui_info() {
    printf "  %sℹ%s %s\n" "$C_BLUE" "$C_RESET" "$1"
}

ui_skip() {
    printf "  %s○ %s%s\n" "$C_DIM" "$1" "$C_RESET"
}

ui_step() {
    printf "  %s→%s %s\n" "$C_DIM" "$C_RESET" "$1"
}

ui_detail() {
    printf "    %s%s%s\n" "$C_DIM" "$1" "$C_RESET"
}

ui_error_box() {
    local msg="$1"
    echo ""
    printf "  %s%s┌─ Error ──────────────────────────────────────────┐%s\n" "$C_RED" "$C_BOLD" "$C_RESET"
    printf "  %s%s│%s %s\n" "$C_RED" "$C_BOLD" "$C_RESET" "$msg"
    printf "  %s%s└──────────────────────────────────────────────────┘%s\n" "$C_RED" "$C_BOLD" "$C_RESET"
    echo ""
}

ui_success_box() {
    local msg="$1"
    echo ""
    printf "  %s%s┌─ Success ────────────────────────────────────────┐%s\n" "$C_GREEN" "$C_BOLD" "$C_RESET"
    printf "  %s%s│%s %s\n" "$C_GREEN" "$C_BOLD" "$C_RESET" "$msg"
    printf "  %s%s└──────────────────────────────────────────────────┘%s\n" "$C_GREEN" "$C_BOLD" "$C_RESET"
    echo ""
}

ui_key_value() {
    local key="$1"
    local value="$2"
    printf "  %s%-14s%s %s%s%s\n" "$C_DIM" "$key" "$C_RESET" "$C_BRIGHT_WHITE" "$value" "$C_RESET"
}

ui_divider() {
    printf "  %s%s%s\n" "$C_DIM" "$(printf '─%.0s' $(seq 1 50))" "$C_RESET"
}

# ── Spinner ──────────────────────────────────────────────────

_SPINNER_PID=""
_SPINNER_FRAMES=('⠋' '⠙' '⠹' '⠸' '⠼' '⠴' '⠦' '⠧' '⠇' '⠏')

ui_spinner_start() {
    local msg="$1"
    (
        local i=0
        while true; do
            printf "\r  %s%s%s %s" "$C_CYAN" "${_SPINNER_FRAMES[$((i % 10))]}" "$C_RESET" "$msg"
            i=$((i + 1))
            sleep 0.08
        done
    ) &
    _SPINNER_PID=$!
    disown "$_SPINNER_PID" 2>/dev/null
}

ui_spinner_stop() {
    if [ -n "$_SPINNER_PID" ]; then
        kill "$_SPINNER_PID" 2>/dev/null
        wait "$_SPINNER_PID" 2>/dev/null
        _SPINNER_PID=""
        printf "\r\033[K"
    fi
}

# ── Timestamp ────────────────────────────────────────────────

ui_timestamp() {
    printf "%s%s%s" "$C_DIM" "$(date '+%H:%M:%S')" "$C_RESET"
}

# ── OS Detection ─────────────────────────────────────────────

detect_os_label() {
    case "$OSTYPE" in
        darwin*)          printf "%smacOS%s" "$C_BRIGHT_WHITE" "$C_RESET" ;;
        linux-gnu*)       printf "%sLinux%s" "$C_YELLOW" "$C_RESET" ;;
        msys*|cygwin*)    printf "%sWindows%s" "$C_CYAN" "$C_RESET" ;;
        *)                printf "%s%s%s" "$C_DIM" "$OSTYPE" "$C_RESET" ;;
    esac
}
