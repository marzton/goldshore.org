# Cloudflare Setup Guide

This guide outlines the one-time manual steps required to set up the GoldShore project on Cloudflare.

## 1. Prerequisites

- A Cloudflare account with an active zone for your domain (e.g., `goldshore.org`).
- The `wrangler` CLI installed and authenticated.
- GitHub repository secrets configured for Pages deploys:
  - `CLOUDFLARE_API_TOKEN`
  - `CLOUDFLARE_ACCOUNT_ID`
  - `CLOUDFLARE_PAGES_PROJECT_NAME` (for example `goldshore-org`)

## 2. GitHub Actions Pages deployment flow

The workflow `.github/workflows/pages-web-deploy.yml` (mirrored to `infra/github/actions/workflows/pages-web-deploy.yml`) performs:

1. Repository checkout and dependency install (`pnpm install`).
2. Web build (`pnpm --filter @goldshore/web build`).
3. Pages deploy of `apps/goldshore-web/dist` via `wrangler pages deploy`.

Branch/environment alignment is enforced in workflow logic:

- `main` -> production -> `goldshore.org`
- `preview` -> preview -> `preview.goldshore.org`
- `dev` -> development -> `dev.goldshore.org`

## 3. Create Cloudflare Pages Projects

You will need to create two Cloudflare Pages projects, one for the web application and one for the admin dashboard.

### `goldshore-web`

Canonical source directory for Astro files: `apps/goldshore-web/src` (single source of truth).

1.  Navigate to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
2.  Select your GitHub repository.
3.  In the **Build settings**, select the following:
    *   **Framework preset**: Astro
    *   **Build command**: `pnpm -w --filter @goldshore/web build`
    *   **Build output directory**: `apps/goldshore-web/dist`
4.  Click **Save and Deploy**.
5.  After the initial deployment, go to the project's **Settings** > **Custom Domains** and add your production domain (e.g., `goldshore.org`).


## 4. Provision Cloudflare Resources

The `infra/cloudflare/provision.sh` script will programmatically create the necessary D1, KV, R2, and Queue resources. Run this script from the root of the repository:

```bash
bash infra/cloudflare/provision.sh
```


## 5. Configure API Worker environments

`apps/goldshore-api/wrangler.toml` now requires environment-variable interpolation for all per-environment Cloudflare bindings.

Before running `wrangler deploy`, export the following variables (or provide them via your CI secret store):

### Dev (`--env dev`)

- `D1_DATABASE_ID_DEV`
- `R2_BUCKET_NAME_DEV`
- `KV_NAMESPACE_ID_DEV`
- `QUEUE_NAME_DEV`

### Preview (`--env preview`)

- `D1_DATABASE_ID_PREVIEW`
- `R2_BUCKET_NAME_PREVIEW`
- `KV_NAMESPACE_ID_PREVIEW`
- `QUEUE_NAME_PREVIEW`

### Production (`--env prod`)

- `D1_DATABASE_ID_PROD`
- `R2_BUCKET_NAME_PROD`
- `KV_NAMESPACE_ID_PROD`
- `QUEUE_NAME_PROD`

The API worker also declares the non-secret runtime var `CF_TEAM_DOMAIN` in `wrangler.toml`.

Validate variables are populated before deploy:

```bash
: "${D1_DATABASE_ID_DEV:?}" "${R2_BUCKET_NAME_DEV:?}" "${KV_NAMESPACE_ID_DEV:?}" "${QUEUE_NAME_DEV:?}"
: "${D1_DATABASE_ID_PREVIEW:?}" "${R2_BUCKET_NAME_PREVIEW:?}" "${KV_NAMESPACE_ID_PREVIEW:?}" "${QUEUE_NAME_PREVIEW:?}"
: "${D1_DATABASE_ID_PROD:?}" "${R2_BUCKET_NAME_PROD:?}" "${KV_NAMESPACE_ID_PROD:?}" "${QUEUE_NAME_PROD:?}"
```

Route behavior configured in `wrangler.toml`:

- `dev` -> `api-dev.goldshore.org/*` (`workers_dev = true`)
- `preview` -> `api-preview.goldshore.org/*` (`workers_dev = true`)
- `prod` -> `api.goldshore.org/*` (`workers_dev = false`)

## 6. Configure DNS

Ensure that you have the following DNS records configured in your Cloudflare zone:

-   A `CNAME` record for `goldshore.org` pointing to your `goldshore-web` Pages project.
-   An `A` record or `CNAME` record for `api.goldshore.org` pointing to your `goldshore-api` worker.

This is a one-time setup. Subsequent deployments will be handled automatically by the CI/CD pipeline.
