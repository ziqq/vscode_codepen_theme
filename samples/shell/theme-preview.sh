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
