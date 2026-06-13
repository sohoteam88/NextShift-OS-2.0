# GitHub Actions CI

## Workflow

`.github/workflows/ci.yml` runs on every push and pull request to `main` and `develop`.

### Jobs

#### `quality` — Type Check + Lint + Build (15 min timeout)
1. Checkout repository
2. Setup pnpm 10 + Node.js 22
3. `pnpm install --frozen-lockfile`
4. `npx prisma generate` — generates Prisma client from schema
5. `pnpm type-check` — TypeScript strict mode
6. `pnpm lint` — ESLint
7. `pnpm build` — Next.js production build

#### `test` — Database Tests (15 min timeout)
1. Spins up PostgreSQL 17 service container
2. Checkout + pnpm + install
3. `npx prisma generate` + `npx prisma db push` — creates schema
4. `pnpm test` — Vitest with real database

### Environment Variables

| Variable | CI Value |
|----------|----------|
| `DATABASE_URL` | `postgresql://ci:ci@localhost:5432/ci?schema=public` |
| `DIRECT_URL` | Same |

### Concurrency

Only one workflow per branch/PR runs at a time. New pushes cancel in-progress runs.

### Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Prisma generate fails | Schema syntax error | Run `pnpm type-check` locally first |
| Build fails | Next.js compilation error | Check for missing imports or type errors |
| Tests fail | DB connection refused | Ensure PostgreSQL service container is healthy |
| `frozen-lockfile` fails | pnpm-lock.yaml out of sync | Run `pnpm install` locally and commit the lockfile |

### Status Badges

```
[![CI](https://github.com/sohoteam88/NextShift-OS-2.0/actions/workflows/ci.yml/badge.svg)](https://github.com/sohoteam88/NextShift-OS-2.0/actions/workflows/ci.yml)
```
