#!/usr/bin/env bash
set -euo pipefail

staged_files="$(git diff --cached --name-only)"
[[ -z "$staged_files" ]] && exit 0

block_regex='(^|/)(node_modules|\.pnpm-store|\.turbo|dist|build|coverage|\.cache|tmp|temp)(/|$)|\.(tmp|swp|swo|orig|rej)$|(^|/)pnpm-debug\.log$|(^|/)npm-debug\.log$'

violations="$(printf '%s\n' "$staged_files" | rg -n "$block_regex" || true)"
if [[ -n "$violations" ]]; then
  echo "Blocked staged files detected (generated/conflict artifacts):" >&2
  echo "$violations" >&2
  echo "Unstage/remove these files before committing." >&2
  exit 1
fi

echo "No blocked staged artifact paths detected."
