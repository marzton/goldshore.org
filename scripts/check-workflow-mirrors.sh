#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_DIR="$ROOT_DIR/.github/workflows"
MIRROR_DIR="$ROOT_DIR/infra/github/actions/workflows"

status=0

while IFS= read -r mirror_file; do
  rel_path="${mirror_file#${MIRROR_DIR}/}"
  source_file="$SOURCE_DIR/$rel_path"

  if [[ ! -f "$source_file" ]]; then
    echo "::warning::Mirror exists without canonical source: $rel_path"
    status=1
    continue
  fi

  if ! diff -u "$source_file" "$mirror_file" > /tmp/workflow-mirror.diff; then
    echo "::error::Workflow mirror drift detected for $rel_path"
    cat /tmp/workflow-mirror.diff
    status=1
  fi
done < <(find "$MIRROR_DIR" -maxdepth 1 -type f \( -name '*.yml' -o -name '*.yaml' \) | sort)

if [[ "$status" -ne 0 ]]; then
  echo "Run ./scripts/sync-workflow-mirrors.sh to resync mirrored workflow files."
  exit "$status"
fi

echo "Workflow mirrors are in sync."
