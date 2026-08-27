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
