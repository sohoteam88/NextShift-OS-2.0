# Sentry Monitoring

## Setup

```bash
pnpm add @sentry/nextjs
```

Set `SENTRY_DSN` in `.env.production`:

```
SENTRY_DSN=https://xxx@sentry.io/yyy
```

Without `SENTRY_DSN`, Sentry is a no-op — app builds and runs normally.

## Configuration Files

| File | Scope | What It Tracks |
|------|-------|---------------|
| `sentry.client.config.ts` | Browser | JS errors, React errors, performance traces |
| `sentry.server.config.ts` | API routes, SSR | API errors, Prisma errors, Auth errors, AI router failures |
| `sentry.edge.config.ts` | Edge middleware | Edge runtime errors |

## What Gets Tracked

| Error Category | Captured By |
|---------------|-------------|
| API errors (500s) | Server config — `captureError()` |
| Prisma errors | Server config — `captureError()` |
| Auth errors (401/403) | Server config |
| AI Router errors | Server config — capture in `fallbackHandler.ts` |
| Automation failures | Server config — capture in `automationEngine.ts` |
| Client-side JS errors | Client config |
| Performance traces | Both configs (10% sample rate in prod) |

## Safety Rules

- **Secrets stripped** — `beforeSend` removes Authorization headers, cookies, and API keys from URLs
- **WhatsApp messages NOT logged** — full message content is excluded by default
- **SENTRY_DSN missing** → Sentry is a no-op, app builds normally
- **`@sentry/nextjs` not installed** → dynamic import catches the error, app continues

## Usage in Code

```typescript
import { captureError } from '@/../sentry.server.config';

try {
  await prisma.$queryRaw`...`;
} catch (error) {
  captureError(error as Error, { context: 'prisma_query', query: sanitizedQuery });
  throw error;
}
```

## Environment

| Variable | Purpose | Required |
|----------|---------|----------|
| `SENTRY_DSN` | Sentry project DSN | Only in production |
| `NEXT_PUBLIC_SENTRY_DSN` | Client-side DSN (same value) | Only in production |

## Verification

1. Deploy with `SENTRY_DSN` set
2. Trigger a test error → should appear in Sentry dashboard
3. Verify no secrets in error details
4. Verify WhatsApp message content not captured
