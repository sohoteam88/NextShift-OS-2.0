# ADR-002: Brand DNA Contract

**Status:** Accepted
**Date:** 2026-06-15
**Deciders:** Dependency graph analysis (V6)

## Context

`brand-dna` is the most referenced domain module in NextShift OS — **13 modules** depend on it. Any schema change to Brand DNA has a blast radius across CRM, AI, funnel, analytics, social-setup, content-engine, video, and 5+ other domains.

## Decision

Brand DNA is a **foundational leaf module** — it imports only `brand-discovery` and is imported by 13 consumers. We treat it as a stable contract:

### Rules

1. **Schema additions are safe** — adding fields doesn't break consumers.
2. **Schema renames require migration plan** — 13 consumers must be updated.
3. **Schema removals are breaking** — require approval + migration window.
4. **JSONB fields (`audiencePainPoints`, `contentPillars`, etc.)** — validated at application layer via Zod before write.
5. **The `BrandProfile` model has a 1:1 relationship with User** — enforced via `@@unique([userId])`.

### Consumer Contract

```typescript
// Stable public API
import { getBrandContext } from '@/modules/brand-dna/services/BrandContextProvider';
import type { BrandContext } from '@/modules/brand-dna/types';
```

All 13 consumers access Brand DNA through `getBrandContext()` — a single service function that returns a typed `BrandContext`. Internal implementation details (Prisma queries, caching) are encapsulated.

## Consequences

- ✅ High cohesion — all brand data flows through one gateway
- ✅ Type-safe — `BrandContext` interface enforces contract
- ⚠️ Changes require coordination across 13 teams/modules
- ⚠️ JSONB arrays (`contentPillars`, `brandColors`) lack referential integrity
