# Cloudflare Route and Binding Repair Plan

## Repository
`marzton/goldshore`

## Objective
Repair and repurpose existing Cloudflare Workers and Pages ownership across the full stack before static relaunch.

## Ownership model
- Public apex host remains static-first.
- API, admin, gateway, preview, and agent surfaces use explicit subdomain routing.
- Deployments fail when critical bindings, KV, queues, staging resources, or DNS targets are missing.

## Required actions
1. Inventory current Pages projects, Worker scripts, and routed hosts.
2. Remove stale apex-capturing routes.
3. Align worker names, route patterns, and service bindings.
4. Verify DNS targets and custom-domain ownership.
5. Preserve rollback records for route IDs, DNS record IDs, and script names.
