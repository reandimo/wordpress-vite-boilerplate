#!/usr/bin/env bash
# Shared UI functions for beautiful terminal output.
# Source this after _env.sh in any script.
# @author Renan Diaz <https://reandimo.dev>

# ── ANSI Colors ──────────────────────────────────────────────
C_RESET='\033[0m'
C_BOLD='\033[1m'
C_DIM='\033[2m'
C_ITALIC='\033[3m'
C_UNDERLINE='\033[4m'

C_RED='\033[31m'
C_GREEN='\033[32m'
C_YELLOW='\033[33m'
C_BLUE='\033[34m'
C_MAGENTA='\033[35m'
C_CYAN='\033[36m'
C_WHITE='\033[37m'
C_BRIGHT_BLACK='\033[90m'
C_BRIGHT_WHITE='\033[97m'
C_BRIGHT_CYAN='\033[96m'
C_BRIGHT_GREEN='\033[92m'
C_BRIGHT_YELLOW='\033[93m'
C_BRIGHT_MAGENTA='\033[95m'

# ── Print helpers ────────────────────────────────────────────

ui_banner() {
    local title="$1"
    local subtitle="${2:-}"
    local width=54
    echo ""
    echo -e "  ${C_CYAN}${C_BOLD}╔$( printf '═%.0s' $(seq 1 $width) )╗${C_RESET}"
    echo -e "  ${C_CYAN}${C_BOLD}║${C_RESET}$(printf ' %.0s' $(seq 1 $(( (width - ${#title}) / 2 )) ))${C_BRIGHT_WHITE}${C_BOLD}${title}${C_RESET}$(printf ' %.0s' $(seq 1 $(( width - ${#title} - (width - ${#title}) / 2 )) ))${C_CYAN}${C_BOLD}║${C_RESET}"
    if [ -n "$subtitle" ]; then
        echo -e "  ${C_CYAN}${C_BOLD}║${C_RESET}$(printf ' %.0s' $(seq 1 $(( (width - ${#subtitle}) / 2 )) ))${C_DIM}${subtitle}${C_RESET}$(printf ' %.0s' $(seq 1 $(( width - ${#subtitle} - (width - ${#subtitle}) / 2 )) ))${C_CYAN}${C_BOLD}║${C_RESET}"
    fi
    echo -e "  ${C_CYAN}${C_BOLD}╚$( printf '═%.0s' $(seq 1 $width) )╝${C_RESET}"
    echo ""
}

ui_section() {
    local title="$1"
    local icon="${2:-◆}"
    echo ""
    echo -e "  ${C_CYAN}${C_BOLD}${icon} ${title}${C_RESET}"
    echo -e "  ${C_DIM}$(printf '─%.0s' $(seq 1 50))${C_RESET}"
}

ui_ok() {
    local text="$1"
    local detail="${2:-}"
    if [ -n "$detail" ]; then
        echo -e "  ${C_GREEN}${C_BOLD}✓${C_RESET} ${text} ${C_DIM}(${detail})${C_RESET}"
    else
        echo -e "  ${C_GREEN}${C_BOLD}✓${C_RESET} ${text}"
    fi
}

ui_fail() {
    echo -e "  ${C_RED}${C_BOLD}✗${C_RESET} $1"
}

ui_warn() {
    echo -e "  ${C_YELLOW}${C_BOLD}⚠${C_RESET} $1"
}

ui_info() {
    echo -e "  ${C_BLUE}ℹ${C_RESET} $1"
}

ui_skip() {
    echo -e "  ${C_DIM}○ $1${C_RESET}"
}

ui_step() {
    echo -e "  ${C_DIM}→${C_RESET} $1"
}

ui_detail() {
    echo -e "    ${C_DIM}$1${C_RESET}"
}

ui_error_box() {
    local msg="$1"
    echo ""
    echo -e "  ${C_RED}${C_BOLD}┌─ Error ──────────────────────────────────────────┐${C_RESET}"
    echo -e "  ${C_RED}${C_BOLD}│${C_RESET} $msg"
    echo -e "  ${C_RED}${C_BOLD}└──────────────────────────────────────────────────┘${C_RESET}"
    echo ""
}

ui_success_box() {
    local msg="$1"
    echo ""
    echo -e "  ${C_GREEN}${C_BOLD}┌─ Success ────────────────────────────────────────┐${C_RESET}"
    echo -e "  ${C_GREEN}${C_BOLD}│${C_RESET} $msg"
    echo -e "  ${C_GREEN}${C_BOLD}└──────────────────────────────────────────────────┘${C_RESET}"
    echo ""
}

ui_key_value() {
    local key="$1"
    local value="$2"
    local color="${3:-$C_BRIGHT_WHITE}"
    printf "  ${C_DIM}%-14s${C_RESET} ${color}%s${C_RESET}\n" "$key" "$value"
}

ui_divider() {
    echo -e "  ${C_DIM}$(printf '─%.0s' $(seq 1 50))${C_RESET}"
}

# ── Spinner ──────────────────────────────────────────────────
# Usage: ui_spinner_start "message" && long_command && ui_spinner_stop

_SPINNER_PID=""
_SPINNER_FRAMES=('⠋' '⠙' '⠹' '⠸' '⠼' '⠴' '⠦' '⠧' '⠇' '⠏')

ui_spinner_start() {
    local msg="$1"
    (
        local i=0
        while true; do
            printf "\r  ${C_CYAN}%s${C_RESET} %s" "${_SPINNER_FRAMES[$((i % 10))]}" "$msg"
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
    echo -e "${C_DIM}$(date '+%H:%M:%S')${C_RESET}"
}

# ── OS Detection ─────────────────────────────────────────────

detect_os_label() {
    case "$OSTYPE" in
        darwin*)          echo -e "${C_BRIGHT_WHITE}macOS${C_RESET}" ;;
        linux-gnu*)       echo -e "${C_YELLOW}Linux${C_RESET}" ;;
        msys*|cygwin*)    echo -e "${C_CYAN}Windows${C_RESET}" ;;
        *)                echo -e "${C_DIM}$OSTYPE${C_RESET}" ;;
    esac
}
