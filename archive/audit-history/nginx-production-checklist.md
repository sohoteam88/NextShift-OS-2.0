# E1A Nginx Production Checklist

Date: 2026-06-19
Status: READY FOR E2
Blocker: E1A-005 Production Nginx + SSL Verification

## Objective

Document the production ingress path and the checks required to keep it valid.

## Live Verification Performed

On 2026-06-19:

- `http://nextshiftos.com` returned `301 Moved Permanently`.
- Redirect location was `https://nextshiftos.com/`.
- `https://nextshiftos.com` responded through `nginx/1.18.0 (Ubuntu)`.
- HTTPS route redirected unauthenticated traffic to `/login`.
- Security headers were present, including HSTS.

## Required Production Nginx Properties

| Check | Status | Evidence |
| --- | --- | --- |
| Production domain | PASS | `nextshiftos.com` responds |
| HTTP to HTTPS redirect | PASS | `http://nextshiftos.com` -> `https://nextshiftos.com/` |
| Reverse proxy to Next.js | PASS | HTTPS response served app/login |
| Websocket support | CHECKLIST | Repo Nginx config has upgrade headers; live config not SSH-verified |
| Gzip | CHECKLIST | Not confirmed from live headers |
| Supabase callbacks | CHECKLIST | Generic proxy should pass routes; callback-specific path not separately verified |
| Runtime routes | PASS | App route responds over HTTPS |

## Recommended Nginx Baseline

Production should include:

```nginx
server {
  listen 80;
  listen [::]:80;
  server_name nextshiftos.com www.nextshiftos.com;
  return 301 https://nextshiftos.com$request_uri;
}

server {
  listen 443 ssl http2;
  listen [::]:443 ssl http2;
  server_name nextshiftos.com;

  gzip on;
  gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_cache_bypass $http_upgrade;
  }
}
```

## Operator Verification Commands

Run on deployment host:

```bash
sudo nginx -t
sudo nginx -T | grep -E "server_name|listen 443|ssl_certificate|return 301|gzip"
sudo systemctl status nginx --no-pager
```

Run externally:

```bash
curl -I http://nextshiftos.com
curl -I -L https://nextshiftos.com
curl -fsS https://nextshiftos.com/api/v1/health
```

## Final Decision

READY FOR E2
