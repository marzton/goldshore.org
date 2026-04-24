# GS-Web location + Cloudflare/GitHub runbook

## 1) Where `gs-web` should live

**Recommendation:** keep `gs-web` in **`goldshore-org`** (marketing/domain-facing monorepo), not `goldshore-ai`.

Reasoning:
- `goldshore-org` already contains the website/router/deployment surface (`apps/goldshore-web`, root `wrangler.toml`, static assets).
- `goldshore-ai` should stay focused on AI runtime/service logic and reusable SDK components.
- This split lowers recursive duplication and prevents build graph feedback loops between marketing and AI runtime packages.

### Repo ownership model
- `marzton/goldshore-org`: domain, marketing web, worker routing, DNS-facing config.
- `marzton/goldshore-ai`: prompts/agents/AI orchestration runtime.
- Shared contracts go in dedicated packages (schema/types) and are consumed by both repos via versioned packages.

## 2) Cloudflare API handler setup (detailed)

Set these environment variables in your shell or CI secret store:

```bash
export CLOUDFLARE_API_TOKEN="<token-with-workers-dns-pages-access>"
export CF_ACCOUNT_ID="<cloudflare-account-id>"
export CF_ZONE_ID_ORG="<zone-id-for-goldshore.org>"
export CF_ZONE_ID_AI="<zone-id-for-goldshore.ai>"
export GITHUB_TOKEN="<github-token-with-repo-read-actions-read>"
export GH_OWNER="marzton"
```

### Required token scopes (minimum practical)
- Cloudflare token:
  - Account: Workers Scripts (Read/Edit)
  - Account: Workers Routes (Read/Edit)
  - Account: Pages (Read/Edit)
  - Zone: DNS (Read/Edit)
  - Zone: Zone Settings (Read)
- GitHub token:
  - `repo` (or fine-grained read for selected repos)
  - `actions:read`
  - `administration:read` (if checking branch protection/rulesets)

### Verify credentials
```bash
curl -s -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  https://api.cloudflare.com/client/v4/user/tokens/verify | jq

gh auth status
```

### Audit all current workers/routes/pages
```bash
./scripts/audit-cloudflare-github.sh
```

Audit output is written to `artifacts/audit/<timestamp>/`:
- `cloudflare_workers.json`
- `cloudflare_pages.json`
- `cloudflare_routes_org.json`
- `cloudflare_routes_ai.json`
- `github_repos.json`
- `github_workflows_goldshore_org.json`
- `github_workflows_goldshore_ai.json`

## 3) Scrape + integrate `https://marzton.github.io/goldshore/`

Use the scripted sync pipeline:

```bash
./scripts/sync-gs-org-content.sh
```

What it does:
1. Mirrors the target website into `repo/gs-org-mirror/`.
2. Copies the mirrored payload into `apps/goldshore-web/public/gs-org/`.
3. Ensures a canonical Astro route exists at `apps/goldshore-web/src/pages/gs-org.astro` that redirects visitors to `/gs-org/`.

Then build/test:
```bash
pnpm install
pnpm --filter @goldshore/web build
```

## 4) Agent-safe branch/tag conventions

Use this branch format to identify agent and domain scope:

```text
agent/<agent-name>/<domain>/<workstream>/<yyyy-mm-dd>
```

Examples:
- `agent/codex/cloudflare/audit-workers-2026-04-22`
- `agent/claude/web/gs-org-theme-sync-2026-04-22`

Use annotated tags for audit milestones:

```text
audit/<domain>/<topic>/<yyyy-mm-dd>
```

Examples:
- `audit/cloudflare/workers-inventory/2026-04-22`
- `audit/github/rulesets/2026-04-22`

## 5) Anti-conflict hygiene checks

Before commit, run:

```bash
./scripts/prevent-conflict-artifacts.sh
```

This fails fast if staged changes include common conflict-heavy/generated junk:
- `.pnpm-store/`, `node_modules/`, `.turbo/`, `dist/`, `build/`, `.cache/`, temp files, swap files
- merge leftovers (`*.orig`, `*.rej`)

Wire it into local hooks and CI to prevent recurrence.
