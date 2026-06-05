# 18 — Deployment Architecture

> VPS + Docker + Nginx + SSL deployment for NextShift OS.

---

## 1. Purpose

Define the production infrastructure, containerization strategy, CI/CD pipeline, and operational procedures for deploying and maintaining NextShift OS on a VPS.

## 2. Scope

- Server infrastructure
- Docker containerization
- Nginx reverse proxy + SSL
- CI/CD pipeline
- Environment management
- Monitoring and logging
- Backup strategy
- Scaling path

---

## 3. Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Hosting | VPS (Hetzner / DigitalOcean / Contabo) | Cost-effective; full control; Malaysia-proximate Singapore DCs |
| Containerization | Docker + Docker Compose | Standard; reproducible; easy to manage on single VPS |
| Reverse proxy | Nginx | Battle-tested; handles SSL, gzip, rate limiting, subdomain routing |
| SSL | Let's Encrypt (Certbot) | Free; auto-renewal |
| CI/CD | GitHub Actions | Free for private repos; integrates with Docker Hub |
| Process manager | Docker restart policies | No need for PM2 inside containers |
| Log aggregation | Docker logs + Loki (Phase 2) | Start simple; centralize later |

---

## 4. Infrastructure Layout

### 4.1 Single VPS (Phase 1: 0–5K users)

```
VPS: 4 vCPU / 8 GB RAM / 160 GB SSD
Location: Singapore (closest to Malaysia)

┌─────────────────────────────────────────────────┐
│  VPS                                            │
│                                                 │
│  ┌───────────┐   ┌──────────────┐               │
│  │  Nginx    │──▶│  Next.js App │ (port 3000)   │
│  │  :80/:443 │   │  (Container) │               │
│  └───────────┘   └──────────────┘               │
│       │          ┌──────────────┐               │
│       │          │  Worker      │ (cron jobs,   │
│       │          │  (Container) │  message queue)│
│       │          └──────────────┘               │
│       │          ┌──────────────┐               │
│       │          │  Redis       │ (port 6379)   │
│       │          │  (Container) │ rate limiting, │
│       │          └──────────────┘  job queue     │
│       │          ┌──────────────┐               │
│       │          │  n8n         │ (port 5678)   │
│       │          │  (Container) │ automation     │
│       │          └──────────────┘               │
│                                                 │
│  PostgreSQL: Supabase Cloud (external)          │
│  Storage: Supabase Storage (external)           │
└─────────────────────────────────────────────────┘
```

### 4.2 Phase 2 (5K–50K users)

- Separate VPS for n8n + worker
- Add CDN (Cloudflare) for static assets and funnel pages
- Redis moved to managed service or dedicated container with persistence
- Consider Supabase self-hosted or migrate to managed PostgreSQL

---

## 5. Docker Compose

```yaml
# docker-compose.prod.yml

version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    container_name: nextshift-app
    restart: unless-stopped
    ports:
      - "127.0.0.1:3000:3000"
    env_file: .env.production
    depends_on:
      - redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  worker:
    build:
      context: .
      dockerfile: Dockerfile
      target: worker
    container_name: nextshift-worker
    restart: unless-stopped
    env_file: .env.production
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    container_name: nextshift-redis
    restart: unless-stopped
    ports:
      - "127.0.0.1:6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru

  n8n:
    image: n8nio/n8n:latest
    container_name: nextshift-n8n
    restart: unless-stopped
    ports:
      - "127.0.0.1:5678:5678"
    env_file: .env.n8n
    volumes:
      - n8n_data:/home/node/.n8n

volumes:
  redis_data:
  n8n_data:
```

### 5.1 Dockerfile (Multi-stage)

```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && pnpm build

# Stage 3: Production
FROM node:20-alpine AS production
WORKDIR /app
RUN apk add --no-cache ffmpeg  # for voice capture audio conversion
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "server.js"]

# Stage 4: Worker
FROM node:20-alpine AS worker
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist/worker ./
ENV NODE_ENV=production
CMD ["node", "worker.js"]
```

---

## 6. Nginx Configuration

```nginx
# /etc/nginx/sites-available/nextshift

# Redirect HTTP → HTTPS
server {
    listen 80;
    server_name app.nextshift.my *.nextshift.my;
    return 301 https://$host$request_uri;
}

# Main app
server {
    listen 443 ssl http2;
    server_name app.nextshift.my *.nextshift.my;

    ssl_certificate /etc/letsencrypt/live/nextshift.my/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/nextshift.my/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options DENY always;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;

    # Static assets (long cache)
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # API
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # File upload size (voice capture)
        client_max_body_size 15M;
    }

    # Everything else
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# n8n (internal access only or protected)
server {
    listen 443 ssl http2;
    server_name n8n.nextshift.my;

    ssl_certificate /etc/letsencrypt/live/nextshift.my/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/nextshift.my/privkey.pem;

    # Basic auth or IP whitelist for n8n
    # auth_basic "n8n Admin";
    # auth_basic_user_file /etc/nginx/.htpasswd;

    location / {
        proxy_pass http://127.0.0.1:5678;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 6.1 Wildcard SSL

```bash
# Using Certbot with DNS challenge for wildcard
certbot certonly --dns-cloudflare \
  --dns-cloudflare-credentials /etc/letsencrypt/cloudflare.ini \
  -d nextshift.my -d '*.nextshift.my'

# Auto-renew via cron
0 3 * * * certbot renew --quiet --post-hook "systemctl reload nginx"
```

---

## 7. CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml

name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm type-check
      - run: pnpm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build and push Docker image
        run: |
          docker build -t nextshift-app:${{ github.sha }} --target production .
          docker save nextshift-app:${{ github.sha }} | gzip > image.tar.gz

      - name: Deploy to VPS
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.VPS_HOST }}
          username: deploy
          key: ${{ secrets.VPS_SSH_KEY }}
          source: "image.tar.gz,docker-compose.prod.yml"
          target: "/home/deploy/nextshift"

      - name: Restart services
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.VPS_HOST }}
          username: deploy
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /home/deploy/nextshift
            docker load < image.tar.gz
            docker compose -f docker-compose.prod.yml up -d app worker
            docker image prune -f
            rm image.tar.gz
```

---

## 8. Environment Management

| Environment | Purpose | Database | Domain |
|-------------|---------|----------|--------|
| local | Development | Local PostgreSQL or Supabase dev project | localhost:3000 |
| staging | Pre-production testing | Separate Supabase project | staging.nextshift.my |
| production | Live | Production Supabase project | app.nextshift.my |

### 8.1 Environment Variables

```bash
# .env.production (NEVER committed)
DATABASE_URL=
DIRECT_URL=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
WHATSAPP_API_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
RESEND_API_KEY=
NEXTAUTH_SECRET=
NEXTAUTH_URL=https://app.nextshift.my
N8N_WEBHOOK_URL=http://localhost:5678
REDIS_URL=redis://localhost:6379
```

---

## 9. Monitoring

### 9.1 Phase 1 (MVP)

- **Health endpoint:** `GET /api/health` → checks DB + Redis connectivity
- **Uptime monitoring:** UptimeRobot (free) pings health endpoint every 5 min
- **Docker logs:** `docker logs nextshift-app --tail 100 -f`
- **Disk/CPU/RAM:** Simple cron script → alert via Telegram/WhatsApp if thresholds exceeded

### 9.2 Phase 2

- Grafana + Loki for log aggregation
- Prometheus for metrics (request latency, error rate, AI call duration)
- Sentry for error tracking (client + server)

---

## 10. Backup Strategy

| Data | Method | Frequency | Retention |
|------|--------|-----------|-----------|
| PostgreSQL | Supabase daily backups (managed) | Daily | 30 days |
| PostgreSQL (extra) | `pg_dump` via cron → S3/Backblaze | Daily | 90 days |
| Redis | AOF persistence in Docker volume | Continuous | Volume lifecycle |
| n8n workflows | n8n export → git repo | On change | Git history |
| Uploaded files | Supabase Storage (managed) | Continuous | Supabase retention |
| `.env` files | Encrypted copy in password manager | On change | Permanent |

---

## 11. Deployment Checklist

```
Pre-deploy:
  [ ] All tests pass
  [ ] Database migrations reviewed
  [ ] Environment variables updated if needed
  [ ] Architecture docs updated if schema/API changed

Deploy:
  [ ] Build Docker image
  [ ] Push to VPS
  [ ] Run database migrations: npx prisma migrate deploy
  [ ] Restart app + worker containers
  [ ] Verify health endpoint
  [ ] Smoke test critical flows (login, CRM, funnel page)

Post-deploy:
  [ ] Monitor error logs for 30 min
  [ ] Check UptimeRobot status
  [ ] Tag release in git
```

---

## 12. Risks / Tradeoffs

| Risk | Mitigation |
|------|------------|
| Single VPS = single point of failure | Daily backups; documented recovery procedure; upgrade to multi-node in Phase 2 |
| Docker image large (Node + ffmpeg) | Multi-stage build; Alpine base; prune dev dependencies |
| SSH key compromise | Dedicated deploy user with limited sudo; key rotation quarterly |
| Supabase outage | No local DB fallback at Phase 1; accept downtime; monitor Supabase status |

---

## 13. Future Expansion

- Blue-green deployment (two app containers behind Nginx)
- Kubernetes migration if scaling beyond single VPS
- Edge caching (Cloudflare Workers) for public funnel pages
- Database read replicas for analytics queries
- Terraform for infrastructure-as-code

---

**Cross-references:** `17_SECURITY_ARCHITECTURE.md` (SSL, headers, secrets), `12_AUTOMATION_ARCHITECTURE.md` (n8n container), `16_VOICE_CAPTURE_ARCHITECTURE.md` (ffmpeg dependency)
