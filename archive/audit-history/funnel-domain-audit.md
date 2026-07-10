# Funnel Domain Audit — V3 → V4 Architecture Consolidation

**Date:** 2026-06-14
**Scope:** `src/modules/funnel`, `funnel-builder`, `funnel-context`, `funnel-os`
**Method:** Full file-by-file export analysis + cross-module dependency mapping

---

## 1. Current Architecture

### Module Inventory

| Module | Files | Core Responsibility | Has DB Access | Has UI Components |
|---|---|---|---|---|
| `funnel` | 34 | Visual funnel builder + public renderer | ✅ Prisma (CRUD, templates, analytics) | ✅ 20+ editor/renderer components |
| `funnel-builder` | 21 | AI funnel generator (two code paths: deterministic + AI) | ✅ Prisma (funnelBuilderService) | ✅ 14 components (Phase 1 refactored) |
| `funnel-context` | 3 | Funnel strategy context merged from Brand DNA | ✅ Prisma (getFunnelContext) | ✅ 1 dashboard component |
| `funnel-os` | 5 | Funnel health monitoring + progress tracking | ✅ Prisma (funnelProgressService) | ✅ 1 card component |

### API Route Map

```
/api/v1/funnel/
  funnels/                  ← CRUD (list, create, get, update, delete)
  funnels/[id]/analytics    ← Per-funnel analytics
  funnels/[id]/health       ← Per-funnel health score
  funnels/[id]/publish      ← Publish/unpublish
  templates/                ← Template CRUD
  templates/[id]/
  upload/                   ← Image upload
  analytics/                ← Aggregate analytics

/api/v1/funnel-builder/
  route.ts                  ← GET legacy funnel / POST generate
  generate/                 ← POST generate (legacy deterministic path)

/api/v1/funnel-context/
  route.ts                  ← GET all funnel contexts

/api/v1/funnel-os/
  route.ts                  ← GET progress + health + next action + milestones + KPIs
```

---

## 2. Overlap Matrix

### 2.1 Duplicated Type Definitions

| Type | `funnel` | `funnel-builder` | `funnel-context` | `funnel-os` | Severity |
|---|---|---|---|---|---|
| **`FunnelType`** | `'landing' \| 'quiz' \| 'lead_magnet'` | `'lead_magnet' \| 'webinar' \| 'whatsapp' \| 'consultation' \| 'challenge'` | `'retail' \| 'recruitment' \| 'upgrade'` | *(imports from funnel-context)* | 🔴 CRITICAL — 3 different type definitions, same name, incompatible values |
| **`FunnelHealth`** | — | `{ score, audienceFit, offerClarity, pageClarity, ctaStrength, trustElements, followUpReadiness, trafficReadiness, missingItems, recommendations }` | — | `{ traffic, content, conversion, followUp, pipeline, overallScore }` | 🟠 HIGH — two health models, different scoring dimensions |
| **`LandingPage`** | `{ headline, subheadline, heroCta, problem, solution, benefits, credibility, leadBlock, faq, finalCta }` | `{ headline, subheadline, heroCta, problem, solution, benefits, credibility, leadBlock, faq, finalCta }` (structurally equivalent) | — | — | 🟡 MEDIUM — near-identical landing page models |

### 2.2 Duplicated Service Logic

| Service | `funnel` | `funnel-builder` | `funnel-os` | Severity |
|---|---|---|---|---|
| **Health scoring** | `funnelHealthService.calculate()` (5 dims, status labels) | `validateFunnelHealth()` (7 dims, weighted) | `calculateFunnelHealth()` (5 dims, simple) | 🔴 CRITICAL — 3 different health calculators |
| **Strategy building** | `funnelStrategyService.buildStrategy()` (server-side, Prisma) | `buildStrategy()` in `services/api.ts` (client fetch wrapper) | — | 🟠 HIGH — two strategy generation paths |
| **Funnel generation** | *(visual editor — manual)* | `generateFullFunnel()` (deterministic, no AI) + AI path via `useFunnelForm` | — | 🟡 MEDIUM — funnel-builder has two internal generation paths |
| **Next-best-action** | `funnelHealthService.getNextBestAction()` | `funnelAdvisor.getNextBestAction()` | `funnelNextActionEngine.getNextAction()` | 🔴 CRITICAL — 3 different recommendation engines |
| **Funnel DB writes** | `funnelService.create()` (validated, access-controlled) | `funnelBuilderService.generate()` (bypasses service layer, writes directly via Prisma) | — | 🟠 HIGH — two different code paths writing to same `Funnel` table |

### 2.3 Cross-Module Dependency Graph

```
                    ┌─────────────────┐
                    │    brand-dna     │
                    │  (BrandContext)  │
                    └───┬───────┬─────┘
                        │       │
           ┌────────────┘       └────────────┐
           ▼                                 ▼
  ┌─────────────────┐              ┌──────────────────┐
  │  funnel-context  │              │  funnel-builder   │
  │  FunnelType:     │◄─────────────│  (imports         │
  │  retail|recruit  │  imports     │   StrategyContext │
  │  |upgrade        │  FunnelType  │   from funnel)    │
  └────────┬────────┘              └────────┬─────────┘
           │                                │
           │ imports FunnelType             │ imports StrategyContext,
           ▼                                │ CaseStudy from funnel
  ┌─────────────────┐              ┌──────────────────┐
  │    funnel-os     │              │      funnel       │
  │  (health,        │              │  (visual builder, │
  │   progress,      │              │   CRUD, public    │
  │   milestones)    │              │   renderer)       │
  └──────────────────┘              └──────────────────┘
```

**Key observation:** `funnel` is the only module that does NOT import from any other funnel module. It is the de facto source of truth for types and services — yet `funnel-context`, `funnel-os`, and `funnel-builder` all define competing types of the same name.

---

## 3. Merge Candidates

### Priority 1 — Unify `FunnelType`

Three modules define `FunnelType` with different value sets:

| Module | Values | Semantics |
|---|---|---|
| `funnel/types.ts` | `'landing'`, `'quiz'`, `'lead_magnet'` | Page template type (visual builder) |
| `funnel-builder/types.ts` | `'lead_magnet'`, `'webinar'`, `'whatsapp'`, `'consultation'`, `'challenge'` | AI generation funnel type |
| `funnel-context/types.ts` | `'retail'`, `'recruitment'`, `'upgrade'` | Business model funnel type |

**Recommendation:** Rename to disambiguate:
- `funnel/types.ts`: → `FunnelPageType` (describes the page format)
- `funnel-builder/types.ts`: → `FunnelBuilderType` (describes the AI generation strategy)
- `funnel-context/types.ts`: → `BusinessFunnelType` or keep `FunnelType` here as the "business domain" type (this is the one `funnel-os` depends on)

### Priority 2 — Merge Health Services

Three competing health calculators:

| Service | Input | Dimensions | Output |
|---|---|---|---|
| `funnel/funnel-health-service.ts` | FunnelConfig | completeness, real_material_used, diversity, cta_consistency, performance | `FunnelHealthScore` + status + recommendation |
| `funnel-builder/funnelHealthValidator.ts` | FunnelPackage | audienceFit, offerClarity, pageClarity, ctaStrength, trustElements, followUpReadiness, trafficReadiness | `FunnelHealth` + missingItems + recommendations |
| `funnel-os/funnelHealthService.ts` | Counters (content, video, leads, customers) | traffic, content, conversion, followUp, pipeline | `FunnelHealth` + overallScore |

**Recommendation:** Keep `funnel/funnel-health-service.ts` as the canonical health service (it has the richest input + most nuanced output). Deprecate `funnel-builder/funnelHealthValidator.ts` and `funnel-os/funnelHealthService.ts`, redirecting their callers to the canonical service with adapters.

### Priority 3 — Merge Next-Best-Action Engines

Three recommendation engines with nearly identical priority-chain logic:

| Engine | Input | Output |
|---|---|---|
| `funnel/funnel-health-service.ts::getNextBestAction` | Health scores object | `{ action, reason, route }` |
| `funnel-builder/funnelAdvisor.ts::getNextBestAction` | `FunnelHealth` (builder type) | `string` (action only) |
| `funnel-os/funnelNextActionEngine.ts::getNextAction` | Counters + funnelType | `{ action, expectedImpact, route }` |

**Recommendation:** Consolidate into a single `getNextBestAction()` in `funnel/services/`. The `funnel-os` version has the richest return type (`expectedImpact` + `route`). Merge that structure into the canonical service.

### Priority 4 — Deduplicate Landing Page Models

Both `funnel/types.ts::FunnelConfig` (via section union) and `funnel-builder/types.ts::FunnelPackage.landingPage` model a landing page. The `funnel-builder` `LandingPage` interface is structurally very similar to what a FunnelConfig with hero+pain+benefits+cta sections would produce.

**Recommendation:** `FunnelPackage` should be refactored to use `FunnelConfig` as its presentation layer, eliminating the parallel landing page model.

### Priority 5 — Consolidate Funnel DB Writes

`funnelBuilderService.generate()` writes directly to the `Funnel` table via Prisma, bypassing `funnelService.create()`'s validation, access control, and slug generation.

**Recommendation:** `funnelBuilderService.generate()` should delegate to `funnelService.create()` for the DB write, keeping business logic in one place.

---

## 4. Migration Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| Renaming `FunnelType` breaks type checks in 30+ files | High | Certain | Automated rename via `tsc` + find-replace; phased per module |
| Merging health services changes dashboard behavior | Medium | Medium | Preserve all three output shapes as computed views of a unified engine |
| Consolidating DB writes changes funnel creation flow | High | Low | `funnelBuilderService.generate()` already writes the same fields; delegation is additive |
| Removing duplicated components causes UI regressions | Medium | Low | Phase 1 already proved component extraction is safe; same pattern applies |
| Cross-module import cycles emerge after merge | Medium | Low | Current dependency graph is acyclic; merging into `funnel` preserves this |

---

## 5. Recommended V4 Target Structure

```
src/modules/funnel/                    ← Unified funnel domain module
├── types/
│   ├── index.ts                       ← Re-exports all types
│   ├── funnel-page.ts                 ← FunnelPageType, FunnelConfig, FunnelSection, etc. (was: funnel/types.ts)
│   ├── funnel-builder.ts              ← FunnelBuilderType, FunnelPackage, LandingPage, etc. (was: funnel-builder/types.ts)
│   ├── funnel-context.ts              ← BusinessFunnelType, FunnelContext, FunnelContextMap (was: funnel-context/types.ts)
│   ├── funnel-health.ts               ← Unified FunnelHealth, FunnelHealthScore (merged from 3 sources)
│   ├── funnel-os.ts                   ← FunnelProgress, FunnelMilestone, FunnelGoal, FunnelKPI, FunnelNextAction (was: funnel-os/types.ts)
│   └── strategy-context.ts            ← StrategyContext, CaseStudy (unchanged)
│
├── schemas/
│   └── funnel-schemas.ts              ← Zod schemas (unchanged)
│
├── services/
│   ├── funnel-service.ts              ← CRUD (unchanged, canonical)
│   ├── funnel-health-service.ts       ← Unified health calculator (merged from 3 → 1)
│   ├── funnel-strategy-service.ts     ← AI strategy (unchanged, canonical)
│   ├── funnel-next-action.ts          ← Unified next-best-action (merged from 3 → 1)
│   ├── funnel-builder-service.ts      ← Deterministic generation (was: funnel-builder/funnelBuilderService.ts)
│   ├── funnel-generators.ts           ← Deterministic generators (was: funnel-builder/funnelGenerators.ts)
│   ├── quality-gate-service.ts        ← Content quality (unchanged)
│   ├── template-service.ts            ← Templates (unchanged)
│   ├── upload-service.ts              ← Image upload (unchanged)
│   └── funnel-context-provider.ts     ← Context from Brand DNA (was: funnel-context/funnelContextProvider.ts)
│
├── hooks/
│   ├── use-funnels.ts                 ← CRUD hooks (unchanged)
│   ├── use-funnel-form.ts             ← AI generation form hook (was: funnel-builder/hooks/useFunnelForm.ts)
│   └── use-funnel-os.ts               ← OS hook (was: funnel-os component hook, extracted)
│
├── components/
│   ├── builder/                       ← Editor components (HeroEditor, PainEditor, ...)
│   ├── renderer/                      ← Public-facing renderer components
│   ├── ai/                            ← AI generation UI (FunnelResult, RealMaterialForm, StrategyDisplay, ...)
│   ├── os/                            ← Operating system UI (FunnelOperatingCard)
│   ├── shared/                        ← Shared UI (CopyButton, Section, Field, BulletList, InputField, ...)
│   └── dashboard/                     ← Dashboard components (FunnelBuilderDashboard, FunnelContextDashboard, FunnelAnalyticsCard)
│
├── seed/
│   └── default-templates.ts           ← (unchanged)
│
└── index.ts                           ← Public API barrel export

# Modules to deprecate:
#   src/modules/funnel-builder/  → merged into funnel/
#   src/modules/funnel-context/  → merged into funnel/
#   src/modules/funnel-os/       → merged into funnel/
```

### API Routes (unchanged, consolidated under single prefix)

```
/api/v1/funnel/
  funnels/                            ← CRUD
  funnels/[id]/analytics/
  funnels/[id]/health/                ← Unified health endpoint
  funnels/[id]/publish/
  templates/
  templates/[id]/
  upload/
  analytics/
  builder/                            ← was: /api/v1/funnel-builder
  builder/generate/                   ← was: /api/v1/funnel-builder/generate
  context/                            ← was: /api/v1/funnel-context
  os/                                 ← was: /api/v1/funnel-os
```

---

## 6. Refactor Priority

| Phase | Task | Files Affected | Effort | Risk |
|---|---|---|---|---|
| **2a** | Rename `FunnelType` → disambiguate across modules | ~15 files | Small | Low |
| **2b** | Merge 3 health services → 1 | ~8 files | Medium | Medium |
| **2c** | Merge 3 next-best-action engines → 1 | ~6 files | Small | Low |
| **2d** | Consolidate DB writes through `funnelService` | 2 files | Small | Medium |
| **3** | Relocate funnel-builder → funnel/ (move + update imports) | ~20 files | Large | Medium |
| **4** | Relocate funnel-context → funnel/ | ~5 files | Small | Low |
| **5** | Relocate funnel-os → funnel/ | ~8 files | Small | Low |
| **6** | Create unified barrel export (`index.ts`) | 1 file | Small | Low |
| **7** | Delete deprecated module directories | 3 dirs | Trivial | Low |

---

## 7. Summary Statistics

| Metric | Current (V3) | Target (V4) | Delta |
|---|---|---|---|
| Funnel domain modules | 4 | 1 | −3 |
| `FunnelType` definitions | 3 (different!) | 3 (disambiguated names) | 0 (clarified) |
| Health calculators | 3 | 1 | −2 |
| Next-action engines | 3 | 1 | −2 |
| Landing page models | 2 | 1 (FunnelConfig) | −1 |
| DB write paths to `Funnel` table | 2 | 1 | −1 |
| Total files across modules | 63 | ~55 (deduplicated) | −8 |
| Cross-module imports | 8 | 0 (all internal) | −8 |

---

**Next Step:** Proceed with Phase 2a (rename `FunnelType` disambiguation) if approved.
