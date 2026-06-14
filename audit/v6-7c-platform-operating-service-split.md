# V6-7C — Platform Operating Service Split Report

**Date:** 2026-06-14
**Scope:** Split `platformOperatingService.ts` (377 lines) into focused modules
**Status:** ✅ Complete

---

## Before & After

| File | Before | After |
|---|---|---|
| `platformOperatingService.ts` | **377 lines** (monolith) | **112 lines** (orchestrator) |
| `ai-profitability.ts` | — | 73 lines |
| `tenant-health.ts` | — | 66 lines |
| `system-monitoring.ts` | — | 103 lines |

---

## Split Details

| File | Exports | Responsibility |
|---|---|---|
| `ai-profitability.ts` | `computeRevenueMetrics`, `computeAIMetrics`, `computeSummary`, `rm`, `clamp`, `planRevenue` | Revenue + AI cost computation |
| `tenant-health.ts` | `computeTenantHealth`, `TenantHealthRecord`, `ChurnRiskLevel` | Tenant scoring + churn detection |
| `system-monitoring.ts` | `computeGrowthWindow`, `computeAlerts`, `computeFunnelAnalysis`, `FounderAlertPriority` | Growth windows, alerts, funnel analysis |
| `platformOperatingService.ts` | `platformOperatingService` (orchestrator) + type re-exports | Data fetching + delegation |

---

## Verification

```
$ pnpm type-check
✓ tsc --noEmit — 0 errors

$ pnpm build
✓ Compiled successfully
✓ Generating static pages (208/208)
```

## Cumulative Admin Domain Refactoring

| Phase | File | Before | After |
|---|---|---|---|
| V6-7A | `platform-admin-service.ts` | 599 | 25 (barrel) |
| V6-7B | `admin-service.ts` | 486 | 15 (barrel) |
| V6-7C | `platformOperatingService.ts` | 377 | 112 (orchestrator) |
| — | 9 new focused modules | 0 | 782 |
| **Total** | | **1,462** | **934 (−36%)** |

## Remaining Admin Domain Debt

| Item | Lines | Priority |
|---|---|---|
| `workspaceHealthService.ts` | 315 | 🟠 High |
| `AdminCommandCenter.tsx` | 355 | 🟡 Medium |
| `AdminSettingsPanel.tsx` | 349 | 🟡 Medium |
| `PlatformOperatingDashboard.tsx` | 287 | 🟢 Low |
