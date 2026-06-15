# ADR-003: Funnel Domain Architecture

**Status:** Accepted
**Date:** 2026-06-15
**Deciders:** Phases 1–5, V6-7

## Context

The funnel domain originally spanned 4 separate modules with overlapping responsibilities. Three health engines scored the same concept differently. Three next-action engines recommended conflicting actions. Two code paths wrote to the `Funnel` table.

## Decision

### Unified Module Structure (V4)

```
src/modules/funnel/
├── types/          ← FunnelPageType, FunnelBuilderType, BusinessFunnelType,
│                     FunnelConfig, StrategyContext, FunnelHealth...
├── services/       ← 13 services: CRUD, health, strategy, generators, templates...
├── hooks/          ← useFunnels, useFunnelForm, useFunnelOS
├── components/     ← ai/, os/, shared/, builder/, renderer/, dashboard/
├── schemas/        ← Zod validation
└── constants/      ← Label maps, form options
```

### Canonical Write Path

```
funnelService.createInternal(params)
  ├── quotaService.checkFunnelQuota()
  ├── generateSlug() (CJK-aware, collision-resistant)
  └── prisma.funnel.create()

Used by:
  funnelService.create()            ← user-facing API
  funnelBuilderService.generate()   ← deterministic generator
```

### Canonical Health Engine

```
funnelHealthService
  ├── calculate(funnelId, user)       → DB-backed content quality
  ├── evaluatePackage(pkg)            → Package structure validation
  └── evaluateActivity(counts...)     → Activity-based health
```

### Type Disambiguation

| Before | After | Domain |
|---|---|---|
| `FunnelType` in funnel/types.ts | `FunnelPageType` | Page template |
| `FunnelType` in funnel-builder/types.ts | `FunnelBuilderType` | AI generation |
| `FunnelType` in funnel-context/types.ts | `BusinessFunnelType` | Business model |

## Consequences

- ✅ 1,085-line page.tsx → 184 lines (Phase 1)
- ✅ 3 health engines → 1 (Phase 2b)
- ✅ 3 next-action engines → 1 (Phase 2c)
- ✅ 2 DB write paths → 1 (Phase 2d)
- ✅ 4 modules → 1 (Phases 3–5)
- ✅ Config size monitor on all writes (V6-11)
