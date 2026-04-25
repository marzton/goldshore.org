# Manual Cutover Gate (Dashboard-Only)

This checklist is the **manual cutover gate** for Cloudflare dashboard actions. Execute in order and do not proceed if any gate fails.

## Locked host map (freeze before changes)

- `gw.goldshore.ai` → Worker `gs-platform`
- `api.goldshore.ai` → Worker `gs-api`
- `agent.goldshore.ai` → Worker `gs-agent`
- `goldshore.ai` → Pages project `gs-web`

> Decision lock: use **`api.goldshore.ai`** as the API hostname for this cutover.

---

## 1) Fix Cloudflare Access policy (highest risk)

Target active application policy:

- **Replace** `non_identity + everyone`
- **With** `identity + email domain @goldshore.ai`

Gate:

- Confirm protected surface no longer allows anonymous/arbitrary access.

### 1a) Cleanup stale Access applications (after policy correction)

Delete stale duplicates:

- `gs-mail` ×2
- `gs-platform` ×2
- `gs-api` ×2
- `goldshore-core` ×2
- `banproof-me` ×2

Gate:

- Confirm one active application remains per intended surface.

---

## 2) Attach Worker custom domains

In Workers:

1. `gs-platform` → attach `gw.goldshore.ai`
2. `gs-api` → attach `api.goldshore.ai`
3. `gs-agent` → attach `agent.goldshore.ai`

After each attachment, verify:

- Route/custom domain is attached to the intended Worker.
- No duplicate hostname is attached elsewhere.
- Health endpoint responds after binding.

---

## 3) Disconnect redundant `goldshore-ai` build

In Workers / Pages build settings for `goldshore-ai`:

- Disconnect Git build.

Do **not** delete the Worker yet unless dependencies are fully confirmed absent.

Gate:

- Confirm `gs-web` Pages remains the intentional owner for `goldshore.ai`.

---

## 4) Fix `goldshore.org` mail DNS

Add DNS records:

- SPF TXT at apex (`@`):
  - `v=spf1 include:_spf.mx.cloudflare.net ~all`
- DMARC TXT at `_dmarc`:
  - `v=DMARC1; p=none; rua=mailto:<reporting-address>`

If a dedicated reporting mailbox is not ready, use the Cloudflare-generated reporting mailbox standardized for the zone.

---

## 5) Fix `armsway.com` mail routing

Add Cloudflare Email Routing MX records with Cloudflare-required priorities:

- `route1.mx.cloudflare.net`
- `route2.mx.cloudflare.net`
- `route3.mx.cloudflare.net`

Also ensure:

- A valid SPF record exists.
- Conflicting legacy MX records are removed.

---

## 6) Verification commands (post-change)

Use:

```bash
curl -I https://gw.goldshore.ai/health
curl -I https://api.goldshore.ai/health
curl -I https://agent.goldshore.ai/health

# DNS checks
# goldshore.org
nslookup -type=TXT goldshore.org
nslookup -type=TXT _dmarc.goldshore.org

# armsway.com
nslookup -type=MX armsway.com
```

Expected:

- Health endpoints return non-error status (2xx/3xx acceptable per service pattern).
- TXT/MX records resolve publicly after propagation.

---

## 7) Cutover continuation rule

Only continue deploy/cutover after all six sections above pass.
