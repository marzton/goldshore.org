#!/usr/bin/env bash
set -euo pipefail

required=(CLOUDFLARE_API_TOKEN CF_ACCOUNT_ID GITHUB_TOKEN GH_OWNER)
for var in "${required[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    echo "Missing required env var: $var" >&2
    exit 1
  fi
done

stamp="$(date -u +%Y%m%dT%H%M%SZ)"
outdir="artifacts/audit/$stamp"
mkdir -p "$outdir"

cf_auth=(-H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" -H "Content-Type: application/json")
gh_auth=(-H "Authorization: Bearer $GITHUB_TOKEN" -H "Accept: application/vnd.github+json")

curl -fsSL "${cf_auth[@]}" \
  "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/workers/scripts" \
  > "$outdir/cloudflare_workers.json"

curl -fsSL "${cf_auth[@]}" \
  "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/pages/projects" \
  > "$outdir/cloudflare_pages.json"

if [[ -n "${CF_ZONE_ID_ORG:-}" ]]; then
  curl -fsSL "${cf_auth[@]}" \
    "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID_ORG/workers/routes" \
    > "$outdir/cloudflare_routes_org.json"
fi

if [[ -n "${CF_ZONE_ID_AI:-}" ]]; then
  curl -fsSL "${cf_auth[@]}" \
    "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID_AI/workers/routes" \
    > "$outdir/cloudflare_routes_ai.json"
fi

curl -fsSL "${gh_auth[@]}" \
  "https://api.github.com/users/$GH_OWNER/repos?per_page=100&type=owner" \
  > "$outdir/github_repos.json"

for repo in goldshore-org goldshore-ai; do
  curl -fsSL "${gh_auth[@]}" \
    "https://api.github.com/repos/$GH_OWNER/$repo/actions/workflows?per_page=100" \
    > "$outdir/github_workflows_${repo//-/_}.json" || true
done

echo "Audit completed: $outdir"
