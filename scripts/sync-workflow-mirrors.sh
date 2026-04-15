#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_DIR="$ROOT_DIR/.github/workflows"
MIRROR_DIR="$ROOT_DIR/infra/github/actions/workflows"

mkdir -p "$MIRROR_DIR"

while IFS= read -r mirror_file; do
  rel_path="${mirror_file#${MIRROR_DIR}/}"
  source_file="$SOURCE_DIR/$rel_path"

  if [[ ! -f "$source_file" ]]; then
    echo "Skipping mirror with no canonical source: $rel_path"
    continue
  fi

  cp "$source_file" "$mirror_file"
  echo "Synced $rel_path"
done < <(find "$MIRROR_DIR" -maxdepth 1 -type f \( -name '*.yml' -o -name '*.yaml' \) | sort)
