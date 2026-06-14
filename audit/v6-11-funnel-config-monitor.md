# V6-11 — Funnel Config Size Monitor Report

**Date:** 2026-06-14
**Scope:** Add config size monitoring to prevent oversized funnel storage
**Status:** ✅ Complete

---

## Implementation

### New File

| File | Purpose |
|---|---|
| `src/modules/funnel/services/funnel-config-monitor.ts` | Config size measurement + logging |

### Modified File

| File | Change |
|---|---|
| `src/modules/funnel/services/funnel-service.ts` | Added monitor calls to `createInternal()` and `update()` |

---

## Thresholds

| Level | Threshold | Action |
|---|---|---|
| **ok** | ≤ 250 KB | No action |
| **warn** | > 250 KB | `console.warn` log |
| **alert** | > 500 KB | `console.error` + `AnalyticsEvent` DB record |

---

## Integration Points

```
funnelService.createInternal()
  → measureConfigSize(config)
  → if warn/alert: logOversizedConfig(tenantId, null, title, result)

funnelService.update()
  → if input.config: measureConfigSize(input.config)
  → if warn/alert: logOversizedConfig(tenantId, funnelId, title, result)
```

Both use `void` — logging is fire-and-forget, never blocks the main flow.

---

## Alert Schema (AnalyticsEvent)

```json
{
  "eventName": "funnel_config_oversized",
  "properties": {
    "funnelId": "...",
    "title": "...",
    "sizeBytes": 512000,
    "sizeKB": 500,
    "threshold": 500000
  }
}
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

## Files Changed (2)

| File | Change |
|---|---|
| `src/modules/funnel/services/funnel-config-monitor.ts` | NEW — measurement + logging |
| `src/modules/funnel/services/funnel-service.ts` | Added monitor calls to createInternal + update |

## Risk

| Risk | Status |
|---|---|
| Monitor blocks funnel creation | ✅ No — uses `void` + try/catch |
| False alerts on legitimate large funnels | 🟡 Monitor-only — no rejection, just logging |
| DB overhead from alert records | 🟢 Low — only triggers at >500KB |
