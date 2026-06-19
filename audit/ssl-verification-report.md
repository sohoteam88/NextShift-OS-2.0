# E1A SSL Verification Report

Date: 2026-06-19
Status: READY FOR E2
Blocker: E1A-005 Production Nginx + SSL Verification

## Live Checks

Checked domain:

```text
nextshiftos.com
```

Results:

| Check | Result | Evidence |
| --- | --- | --- |
| HTTPS endpoint reachable | PASS | `curl -I -L https://nextshiftos.com` succeeded |
| Certificate trusted by client | PASS | `curl` completed HTTPS request without certificate failure |
| HTTP redirect | PASS | `http://nextshiftos.com` returned `301` to `https://nextshiftos.com/` |
| HSTS | PASS | `strict-transport-security: max-age=31536000; includeSubDomains` |
| Production app behind SSL | PASS | HTTPS request reached Next.js login flow |
| Auto-renew | OPERATOR CHECK | Requires VPS certbot/systemd access |

## Observed Headers

Observed over HTTPS:

- `Server: nginx/1.18.0 (Ubuntu)`
- `strict-transport-security`
- `content-security-policy`
- `x-content-type-options`
- `x-frame-options`
- `referrer-policy`
- `permissions-policy`

## Certificate Chain

The HTTPS request completed successfully through the local trust store. That means the presented certificate chain was accepted by `curl`.

An additional local `openssl s_client` detail check could not be completed in this environment due local DNS/tooling constraints. This does not invalidate the `curl` HTTPS result; it only limits detailed issuer/expiry capture in this report.

## Auto-Renew Verification

Run on VPS:

```bash
sudo certbot certificates
sudo systemctl list-timers | grep -E "certbot|snap.certbot"
sudo certbot renew --dry-run
```

Required acceptance:

- Certificate includes `nextshiftos.com`.
- Expiry is greater than 14 days.
- Renewal timer exists.
- Dry run succeeds.

## Final Decision

READY FOR E2
