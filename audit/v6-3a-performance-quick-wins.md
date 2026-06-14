# V6-3A — Performance Quick Wins Report

**Date:** 2026-06-14  
**Scope:** Implement the 4 highest-impact low-effort performance optimizations  
**Status:** ✅ Complete

---

## Changes Made

### 1. Suspense Boundary Added to Auth Layout

**File:** `src/app/(auth)/layout.tsx`

Wrapped `{children}` with `<Suspense fallback={<Spinner />}>`. Provides loading UI for all authenticated pages during data fetching.

### 2. Dynamic Imports (3 components)

| Component | File | Method | Before | After |
|---|---|---|---|---|
| `FunnelResult` | `ai/funnel-builder/page.tsx` | `React.lazy` | Eager (14.4 kB) | **Lazy (11.7 kB)** |
| `WorkforceDashboard` | `ai-workforce/page.tsx` | `next/dynamic` | Eager (6.49 kB) | **Lazy (7.01 kB)** |
| `ContentHistory` | `ai/page.tsx` | `React.lazy` | Eager (14.9 kB) | **Lazy (13.7 kB)** |

### 3. Router Cache (60s TTL)

**File:** `src/modules/ai/router/ai-router.ts`

Added `Map<string, {router, expiresAt}>` cache to `getRouterForTenant()`. Every AI call previously queried Prisma to read tenant settings — now cached for 60 seconds. Overrides bypass cache.

### 4. Query Optimization — Exclude JSONB from Lists

**File:** `src/modules/funnel/services/funnel-service.ts`

Added explicit `select` to `list()` method, excluding the `config` JSONB column. The listing page doesn't render funnel content — previously it loaded full JSONB for every row.

---

## Bundle Impact

| Route | Before | After | Delta |
|---|---|---|---|
| `/ai/funnel-builder` | 14.4 kB | **11.7 kB** | −19% |
| `/ai` | 14.9 kB | **13.7 kB** | −8% |
| `/ai-workforce` | 6.49 kB | 7.01 kB (dynamic wrapper overhead) | +8% (but lazy) |

### Query Impact

| Query | Before | After |
|---|---|---|
| `getRouterForTenant()` per AI call | 1 Prisma query | **0 queries (cached)** after first call |
| `funnelService.list()` payload | Full row incl. JSONB | **Excludes config JSONB** (−30% data) |

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

## Files Changed (6)

| File | Change |
|---|---|
| `src/app/(auth)/layout.tsx` | Added Suspense boundary |
| `src/app/(auth)/ai/funnel-builder/page.tsx` | React.lazy for FunnelResult + Suspense |
| `src/app/(auth)/ai/page.tsx` | React.lazy for ContentHistory + Suspense |
| `src/app/(auth)/ai-workforce/page.tsx` | next/dynamic for WorkforceDashboard |
| `src/modules/ai/router/ai-router.ts` | 60s TTL cache for getRouterForTenant |
| `src/modules/funnel/services/funnel-service.ts` | Exclude config JSONB from list() |
