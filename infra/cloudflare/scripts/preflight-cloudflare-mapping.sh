#!/usr/bin/env bash
set -euo pipefail

note() { printf "\n\033[1;34m[info]\033[0m %s\n" "$*"; }
fail() { printf "\n\033[1;31m[fail]\033[0m %s\n" "$*"; exit 1; }

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "Required command not found: $1"
}

cf_get() {
  local path="$1"
  curl -fsS "https://api.cloudflare.com/client/v4${path}" \
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    -H "Content-Type: application/json"
}

require_cmd curl
require_cmd jq
require_cmd rg

required_env=(
  CLOUDFLARE_API_TOKEN
  CLOUDFLARE_ACCOUNT_ID
  CLOUDFLARE_ZONE_ID
)
for v in "${required_env[@]}"; do
  [[ -n "${!v:-}" ]] || fail "Missing required env var: ${v}"
done

PAGES_PROJECT="${PAGES_PROJECT:-goldshore-org}"
WORKER_NAME="${WORKER_NAME:-goldshore-org}"

EXPECTED_PAGES_DOMAINS=(
  "goldshore.org"
  "www.goldshore.org"
  "preview.goldshore.org"
  "dev.goldshore.org"
)

EXPECTED_WORKER_ROUTES=(
  "goldshore.org/*"
  "www.goldshore.org/*"
  "preview.goldshore.org/*"
  "dev.goldshore.org/*"
)

EXPECTED_DNS_RECORDS=(
  "CNAME|goldshore.org|goldshore-org.pages.dev|true"
  "CNAME|www.goldshore.org|goldshore.org|true"
  "CNAME|preview.goldshore.org|preview.goldshore-org.pages.dev|true"
  "CNAME|dev.goldshore.org|dev.goldshore-org.pages.dev|true"
)

REQUIRED_WORKER_VARS=(
  APP_NAME
  PRODUCTION_ASSETS
  PREVIEW_ASSETS
  DEV_ASSETS
)

REQUIRED_WORKER_SECRETS=(
  CODEX_JWT_HS256_KEY
  GITHUB_CLIENT_SECRET
  GITHUB_PRIVATE_KEY
  GITHUB_WEBHOOK_SECRET
)

REQUIRED_PAGES_ENV_VARS=(
  NODE_VERSION
  ASSET_BASE_URL
  WORKER_HOSTNAME
  API_BASE_URL
)

note "Validating Pages project exists: ${PAGES_PROJECT}"
pages_project_json="$(cf_get "/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects/${PAGES_PROJECT}")" || fail "Unable to read Pages project ${PAGES_PROJECT}. Check token/account/project mapping."
[[ "$(jq -r '.success' <<<"${pages_project_json}")" == "true" ]] || fail "Cloudflare API did not return success for Pages project ${PAGES_PROJECT}."

note "Validating Pages custom domains"
pages_domains_json="$(cf_get "/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects/${PAGES_PROJECT}/domains")" || fail "Unable to read Pages domains for ${PAGES_PROJECT}."
for domain in "${EXPECTED_PAGES_DOMAINS[@]}"; do
  jq -e --arg d "$domain" '.result[] | select(.name == $d)' <<<"${pages_domains_json}" >/dev/null \
    || fail "Missing Pages custom domain mapping: ${domain} -> ${PAGES_PROJECT}"
done

note "Validating Worker routes for ${WORKER_NAME}"
worker_routes_json="$(cf_get "/zones/${CLOUDFLARE_ZONE_ID}/workers/routes")" || fail "Unable to list Worker routes for zone ${CLOUDFLARE_ZONE_ID}."
for pattern in "${EXPECTED_WORKER_ROUTES[@]}"; do
  jq -e --arg p "$pattern" --arg w "$WORKER_NAME" '.result[] | select(.pattern == $p and .script == $w)' <<<"${worker_routes_json}" >/dev/null \
    || fail "Missing Worker route mapping: ${pattern} -> ${WORKER_NAME}"
done

note "Validating DNS records for apex/www/preview/dev"
for entry in "${EXPECTED_DNS_RECORDS[@]}"; do
  IFS='|' read -r rtype rname rcontent rproxied <<<"${entry}"

  dns_json="$(cf_get "/zones/${CLOUDFLARE_ZONE_ID}/dns_records?type=${rtype}&name=${rname}")" || fail "Unable to read DNS record: ${rtype} ${rname}"

  jq -e \
    --arg content "$rcontent" \
    --argjson proxied "$rproxied" \
    '.result[] | select(.content == $content and .proxied == $proxied)' <<<"${dns_json}" >/dev/null \
    || fail "DNS mapping incomplete for ${rname}: expected ${rtype} ${rname} -> ${rcontent} (proxied=${rproxied})"
done

note "Validating Worker vars and deploy secrets are present"
for v in "${REQUIRED_WORKER_VARS[@]}"; do
  rg -q "^\s*${v}\s*=" wrangler.toml \
    || fail "Required Worker var missing in wrangler.toml: ${v}"
done

for v in "${REQUIRED_PAGES_ENV_VARS[@]}"; do
  jq -e --arg key "$v" '.result.deployment_configs.production.env_vars | has($key)' <<<"${pages_project_json}" >/dev/null \
    || fail "Required Pages production env var missing: ${v}"
done

for secret in "${REQUIRED_WORKER_SECRETS[@]}"; do
  [[ -n "${!secret:-}" ]] || fail "Required CI secret not provided: ${secret}"
done

note "Cloudflare mapping preflight passed"
