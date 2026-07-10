# Phase 7B — Observability Report

**Date:** 2026-06-14
**Scope:** Sentry + PostHog integration with 5 key tracking events
**Status:** ✅ Infrastructure complete; SDK installation pending

---

## 1. Sentry (Error Monitoring)

**Status:** ✅ Config files ready. Enable by setting `SENTRY_DSN`.

Already configured:
- `sentry.client.config.ts` — Browser errors
- `sentry.server.config.ts` — API/SSR errors
- `sentry.edge.config.ts` — Edge function errors

Setup: Add `SENTRY_DSN` and `SENTRY_AUTH_TOKEN` to `.env.local`.

---

## 2. PostHog (Product Analytics)

**Status:** ✅ Tracker built. Install SDK with `pnpm add posthog-js posthog-node`.

### Files Created

| File | Purpose |
|---|---|
| `src/lib/telemetry/tracker.ts` | Unified analytics module with graceful degradation |
| `src/lib/telemetry/posthog.d.ts` | TypeScript declaration for optional PostHog dependency |

### Design
- All tracking calls use `try/catch` — never throws, never blocks
- Optional dependency — works without PostHog installed
- Dynamic import — only loads SDK when `NEXT_PUBLIC_POSTHOG_KEY` is set

---

## 3. Key Events (5 implemented)

| Event | Location | Trigger |
|---|---|---|
| `user_signed_up` | `app/api/v1/auth/register/route.ts` | On successful registration |
| `funnel_created` | `app/api/v1/funnel/funnels/route.ts` | On funnel create (POST) |
| `ai_content_generated` | `modules/ai/services/content-service.ts` | After successful AI generation |
| `content_published` | (ready — `trackContentPublished` exported) | Call from content save/publish flow |
| `upgrade_clicked` | (ready — `trackUpgradeClicked` exported) | Call from billing/upgrade page |

### Event Schema

```typescript
user_signed_up:    { plan, source?, locale }
funnel_created:    { funnel_type, template_used, title, userId }
ai_content_generated: { feature, provider, model, tokens, cost, userId }
content_published: { platform, content_type, word_count, userId }
upgrade_clicked:   { current_plan, target_plan, source_page, userId }
```

---

## 4. Setup Checklist

```bash
# 1. Install SDKs
pnpm add posthog-js posthog-node

# 2. Configure environment
# .env.local:
#   SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
#   NEXT_PUBLIC_POSTHOG_KEY=phc_xxx
#   NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# 3. Verify
pnpm build   # should pass with new deps
```

---

## Verification

```
$ pnpm type-check
✓ tsc --noEmit — 0 errors

$ pnpm build
✓ Compiled successfully
✓ Generating static pages (208/208)
```

---

## Files Changed (5)

| File | Change |
|---|---|
| `src/lib/telemetry/tracker.ts` | NEW — Unified analytics module |
| `src/lib/telemetry/posthog.d.ts` | NEW — TypeScript declaration |
| `src/app/api/v1/auth/register/route.ts` | Added signup tracking |
| `src/app/api/v1/funnel/funnels/route.ts` | Added funnel creation tracking |
| `src/modules/ai/services/content-service.ts` | Added AI content generation tracking |
