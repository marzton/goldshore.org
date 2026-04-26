#!/usr/bin/env bash
set -euo pipefail

SOURCE_URL="${1:-https://marzton.github.io/goldshore/}"
MIRROR_DIR="repo/gs-org-mirror"
PUBLIC_DIR="apps/goldshore-web/public/gs-org"
ROUTE_FILE="apps/goldshore-web/src/pages/gs-org.astro"

rm -rf "$MIRROR_DIR"
mkdir -p "$MIRROR_DIR"

wget --mirror --convert-links --adjust-extension --page-requisites --no-parent \
  --directory-prefix "$MIRROR_DIR" "$SOURCE_URL"

root_dir="$(find "$MIRROR_DIR" -type f -name 'index.html' | head -n 1 | xargs -r dirname)"
if [[ -z "$root_dir" ]]; then
  echo "Failed to find mirrored site root (index.html)." >&2
  exit 1
fi

rm -rf "$PUBLIC_DIR"
mkdir -p "$PUBLIC_DIR"
cp -R "$root_dir"/. "$PUBLIC_DIR"/

cat > "$ROUTE_FILE" <<'ASTRO'
---
return Astro.redirect('/gs-org/');
---
ASTRO

echo "Synced $SOURCE_URL into $PUBLIC_DIR"
