# goldshore — GoldShore Platform MonoRepo (Legacy)

## Status
This repo contains legacy platform code that is being migrated to:
- AI/web → `goldshore-ai`
- API → `goldshore-api`
- Gateway → `goldshore-gateway`
- Admin → `goldshore-admin`

## Repo → Worker → Domain
Currently no active CF deployments from this repo.
Broker adapters and schema packages are consumed by `goldshore-ai` monorepo.

## Cloudflare Pages CI/CD (goldshore web)

The repository now deploys `apps/goldshore-web/dist` to the Cloudflare Pages project for `goldshore.org` via GitHub Actions (`pages-web-deploy.yml`).

Branch/environment alignment:

- `main` -> production -> `goldshore.org`
- `preview` -> preview -> `preview.goldshore.org`
- `dev` -> development -> `dev.goldshore.org`

Required GitHub Actions repository secrets:

- `CLOUDFLARE_API_TOKEN` (token with Cloudflare Pages deploy permissions)
- `CLOUDFLARE_ACCOUNT_ID` (Cloudflare account identifier)
- `CLOUDFLARE_PAGES_PROJECT_NAME` (Pages project name, for example `goldshore-org`)
