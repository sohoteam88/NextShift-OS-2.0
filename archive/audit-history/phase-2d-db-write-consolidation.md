# Phase 2d — DB Write Path Consolidation Report

**Date:** 2026-06-14
**Scope:** Single canonical write path for all `Funnel` table inserts
**Status:** ✅ Complete

---

## Before: 2 Write Paths

| # | Path | File | Method | Quota Check | Slug Generation | DB Call |
|---|---|---|---|---|---|---|
| 1 | Canonical | `funnel/services/funnel-service.ts` | `create(user, input)` | ✅ `quotaService.checkFunnelQuota()` | ✅ `slugify + randomSuffix + collision check` | `prisma.funnel.create()` |
| 2 | Bypass | `funnel-builder/funnelBuilderService.ts` | `generate(userId, type)` | ❌ None | ❌ `funnel-${Date.now()}` (collision-prone) | `prisma.funnel.create()` (direct) |

### Validation Gaps in Path 2

| Concern | Path 1 (canonical) | Path 2 (bypass) |
|---|---|---|
| Funnel quota enforcement | ✅ | ❌ (user could exceed quota via builder) |
| Slug uniqueness guarantee | ✅ (up to 10 collision retries) | ❌ (`Date.now()` not unique under concurrent calls) |
| Slug normalization (CJK support) | ✅ (`/[\s一-鿿]+/g` regex) | ❌ (no slugify, raw timestamp) |
| Template application | ✅ | ❌ (not applicable — uses FunnelPackage) |
| DB include (template relation) | ✅ | ❌ (not needed — returns FunnelPackage) |
| Returns DB record | ✅ | ❌ (returns FunnelPackage) |

---

## After: 1 Canonical Write Path

### Architecture

```
funnelService
├── createInternal(params)    ← NEW: single canonical DB write
│   ├── quotaService.checkFunnelQuota()
│   ├── generateSlug()  (slugify + collision check)
│   └── prisma.funnel.create()
│
├── create(user, input)       ← Delegates to createInternal (unchanged API)
│
└── (used by) funnelBuilderService.generate()
    └── funnelService.createInternal({ tenantId, ownerId, title, config })
```

### Changes

**`funnel-service.ts`:**
- Added `createInternal(params)` — new internal method with:
  - `quotaService.checkFunnelQuota()` — now enforced for builder-generated funnels
  - `generateSlug()` — proper slug with CJK support + collision detection
  - Single `prisma.funnel.create()` call
- Refactored `create()` → delegates to `createInternal()`

**`funnelBuilderService.ts`:**
- Removed direct `prisma.funnel.create()` call
- Removed `import type { Prisma }` (no longer needed)
- Now calls `funnelService.createInternal()` with `{ tenantId, ownerId, title, config }`

---

## Changed Files (2)

| File | Change |
|---|---|
| `src/modules/funnel/services/funnel-service.ts` | Added `createInternal()`; refactored `create()` to delegate |
| `src/modules/funnel-builder/funnelBuilderService.ts` | Delegates DB write to `funnelService.createInternal()` |

---

## Verification

```
$ pnpm type-check
✓ tsc --noEmit — 0 errors

$ pnpm build
✓ Compiled successfully in 5.6s
✓ Generating static pages (208/208)
```

---

## Migration Risk

| Risk | Status |
|---|---|
| Slug format change | ✅ **Improvement** — `funnel-${Date.now()}` → proper `slugified-title-xxxx`. Old slugs unaffected. |
| Quota enforcement for builder funnels | ✅ **Improvement** — previously bypassed quota; now enforced. May surface quota errors that were silently ignored. |
| API contracts | ✅ Unchanged — both `funnelService.create()` and `funnelBuilderService.generate()` retain same signatures and return types |
| DB schema | ✅ Unchanged — same table, same columns |
| FunnelPackage stored as config | ✅ Unchanged — config column is JSONB, accepts any shape |
| Collision handling | ✅ **Improvement** — `Date.now()` could collide under concurrent calls; slugify+retry eliminates this |

---

## Architecture Diagram

```
Before:                             After:

┌──────────────────────┐            ┌──────────────────────┐
│   funnelService      │            │   funnelService      │
│   .create()          │            │                      │
│   ├─ quota check     │            │   createInternal()   │  ← SINGLE ENTRY POINT
│   ├─ slug generate   │            │   ├─ quota check     │
│   └─ prisma.create() │            │   ├─ slug generate   │
└──────────────────────┘            │   └─ prisma.create() │
                                    │                      │
┌──────────────────────┐            │   create() ──────────┤  delegates
│ funnelBuilderService │            │   (user API)         │
│   .generate()        │            └──────────┬───────────┘
│   └─ prisma.create() │  ← bypass             │
│      (no quota,      │                   imports
│       weak slug)     │                       │
└──────────────────────┘            ┌──────────▼───────────┐
                                    │ funnelBuilderService │
                                    │   .generate()        │
                                    │   └─ createInternal()│
                                    └──────────────────────┘
```
