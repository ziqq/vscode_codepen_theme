#!/usr/bin/env bash

set -euo pipefail

theme_name='CodePen Theme Original'
background='#1d1e22'
accent='#96b38a'
declare -A tokens=(
  [keyword]='#ddca7e'
  [string]="$accent"
  [comment]='#717790'
)

print_token() {
  local name="$1"
  local color="${tokens[$name]}"
  printf '%s: %s\n' "$name" "$color"
}

for token in "${!tokens[@]}"; do
  print_token "$token"
done

if [[ "$background" == '#1d1e22' ]]; then
  printf '%s is ready\n' "$theme_name"
fi

describe_mode() {
  case "${1:-dark}" in
    dark | high-contrast)
      printf 'mode=%q theme=%q\n' "$1" "$theme_name"
      ;;
    *)
      printf 'unsupported mode: %s\n' "$1" >&2
      return 64
      ;;
  esac
}

while IFS='=' read -r name color; do
  [[ -n "$name" ]] && printf '%-8s %s\n' "$name" "$color"
done <<EOF
keyword=${tokens[keyword]}
string=${tokens[string]}
comment=${tokens[comment]}
EOF

describe_mode "${CODEPEN_MODE:-dark}"

# ---------------------------------------------------------------------------
# Extended showcase: functions, traps, arrays, arithmetic, parameter expansion.
# ---------------------------------------------------------------------------
readonly MAX_TOKENS=64
declare -i hits=0
declare -a roles=(keyword string comment)
export THEME_HOME="${XDG_CONFIG_HOME:-$HOME/.config}/codepen"

cleanup() {
  local exit_code=$?
  rm -rf -- "${tmp_dir:?}"
  printf 'cleanup finished with %d\n' "$exit_code" >&2
  return "$exit_code"
}
trap cleanup EXIT INT TERM

log() {
  local level=${1^^}; shift
  printf '[%(%H:%M:%S)T] %-5s %s\n' -1 "$level" "$*" >&2
}

is_hex() {
  [[ $1 =~ ^#[0-9a-fA-F]{6}$ ]]
}

render_palette() {
  local -n palette_ref=$1
  local name color
  for name in "${!palette_ref[@]}"; do
    color=${palette_ref[$name]}
    if is_hex "$color"; then
      (( hits++ ))
      printf '%-10s %s\n' "$name" "${color,,}"
    elif [[ -z $color ]]; then
      log warn "empty color for ${name}"
    else
      log error "invalid color '${color}' for ${name}"
      continue
    fi
  done
}

tmp_dir=$(mktemp -d "${TMPDIR:-/tmp}/codepen.XXXXXX")
config_file="$THEME_HOME/theme.conf"

if [[ -f $config_file && -r $config_file ]]; then
  # shellcheck source=/dev/null
  source "$config_file"
elif command -v jq >/dev/null 2>&1; then
  jq -r '.tokens | to_entries[] | "\(.key)=\(.value)"' theme.json >"$tmp_dir/tokens"
else
  log info "no config at ${config_file/#$HOME/\~}"
fi

case "${1:-render}" in
  render | show) render_palette tokens ;;
  count) echo "${#roles[@]} roles, max $MAX_TOKENS" ;;
  -h | --help)
    echo "usage: ${0##*/} [render|count]"
    exit 0
    ;;
  *) log error "unknown command: $1"; exit 2 ;;
esac

while IFS='=' read -r key value; do
  [[ $key == \#* ]] && continue
  echo "$key -> ${value:-<unset>}" | tee -a "$tmp_dir/log" 1>/dev/null
done < <(printf '%s\n' "accent=#96b38a" "# comment" "empty=")

result=$(( (hits * 2 + 0x10) % 7 ))
echo "result=${result} files=$(find "$tmp_dir" -type f | wc -l) pid=$$ args=$#"
