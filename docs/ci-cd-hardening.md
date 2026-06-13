# CI/CD Final Hardening

Date: 2026-06-12

## Workflow Diagram

```
push/PR to develop
    │
    ▼
┌─────────────────────────┐
│  CI Workflow            │
│  ├── quality (15 min)   │
│  │   ├── pnpm install   │
│  │   ├── prisma generate│
│  │   ├── type-check     │
│  │   ├── lint           │
│  │   ├── audit          │
│  │   └── build          │
│  └── test (15 min)      │
│      ├── PostgreSQL     │
│      ├── prisma db push │
│      └── vitest         │
└─────────┬───────────────┘
          │
          │ (only if CI success AND branch = main)
          ▼
┌─────────────────────────┐
│  Deploy Workflow        │
│  ├── Docker build       │
│  ├── SCP to VPS         │
│  ├── docker compose up  │
│  └── image prune        │
└─────────────────────────┘
```

## Trigger Chain

| Event | Workflow | Condition |
|-------|----------|-----------|
| Push to develop | CI (quality + test) | Always |
| PR to main/develop | CI (quality + test) | Always |
| CI completes on main | Deploy | Only if CI conclusion = success |

## Required GitHub Secrets

| Secret | Purpose | Used In |
|--------|---------|---------|
| `VPS_HOST` | VPS IP or hostname | Deploy |
| `VPS_SSH_KEY` | SSH private key for VPS access | Deploy |
| `DATABASE_URL` | Production database connection | VPS .env (NOT GitHub) |
| `DIRECT_URL` | Direct database connection | VPS .env (NOT GitHub) |
| `TEST_DATABASE_URL` | CI test database (optional) | Legacy CI |

## Database URL Security

- **TEST_DATABASE_URL** — used only for CI isolation tests (connects to PostgreSQL service container)
- **DATABASE_URL / DIRECT_URL** for production — stored in VPS `.env` file, NOT in GitHub secrets
- CI uses in-memory credentials (`ci:ci@localhost:5432/ci`) for PostgreSQL service container
- Prisma generate in CI does not need a real database connection

## Branch Protection Rules

Configure in GitHub repo Settings → Branches:

| Rule | Value |
|------|-------|
| Require status checks | `quality`, `test` |
| Require branches up to date | Yes |
| Require PR review | 1 approval (recommended) |
| Dismiss stale reviews | Yes |

## How to Rollback Failed Deploy

1. **Automatic**: If CI fails on main, deploy is NOT triggered (gate in deploy.yml)
2. **Manual rollback**: SSH to VPS, run:
   ```
   cd /home/deploy/nextshift
   docker compose -f docker-compose.prod.yml up -d app  # restarts with previous image
   ```
3. **Image history**: `docker images nextshift-app` shows tagged images by SHA

## How to Manually Re-run Deployment

1. Go to GitHub Actions → Deploy to Production
2. Click "Run workflow" → select branch: main
3. Or trigger via push to main: `git commit --allow-empty -m "trigger deploy" && git push`

## Status Checks

| Check | Required | Provider |
|-------|----------|----------|
| `quality` | ✅ | CI workflow → quality job |
| `test` | ✅ | CI workflow → test job |

## Verification Checklist

- [ ] Push PR to develop → CI runs quality + test
- [ ] Verify quality passes (type-check + lint + build)
- [ ] Verify test passes (PostgreSQL service + vitest)
- [ ] Merge to main → Deploy triggers automatically
- [ ] Verify deploy only runs after CI success (not on CI failure)
- [ ] Verify production DATABASE_URL is NOT in GitHub secrets
