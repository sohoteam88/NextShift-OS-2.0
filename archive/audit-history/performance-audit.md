# Performance Audit — NextShift OS V6-3

**Date:** 2026-06-14
**Scope:** Bundle, render, query, and API performance analysis
**Status:** Audit complete

---

## 1. Bundle Analysis

### Largest Client Bundles (First Load JS)

| Rank | Route | First Load JS | Notes |
|---|---|---|---|
| 🔴 1 | `/funnel/[id]/analytics` | **241 kB** | Chart.js + analytics — largest page |
| 🔴 2 | `/brand-builder/insights` | **240 kB** | 16.3 kB page + heavy shared chunks |
| 🔴 3 | `/onboarding/profile` | **207 kB** | 5.8 kB page + heavy deps |
| 🔴 4 | `/admin/settings` | **208 kB** | 8.45 kB page |
| 🟠 5 | `/settings` | **193 kB** | 5.74 kB page |
| 🟠 6 | `/signup` | **192 kB** | 4.1 kB page |
| 🟠 7 | `/login` | **184 kB** | 1.44 kB page |
| 🟠 8 | `/join/[code]` | **190 kB** | 3.01 kB page |
| 🟠 9 | `/crm/[id]` | **173 kB** | 11.7 kB page |
| 🟠 10 | `/dashboard` | **161 kB** | 20.6 kB page (largest page component) |

### Shared Chunks (affect every page)

| Chunk | Size |
|---|---|
| `1ffbe2fe` (vendor) | 54.2 kB |
| `8055` (framework) | 46.2 kB |
| First Load JS (shared) | **103 kB** |

**Key finding:** 103 kB of JS loads on every page. Pages with heavy client-side interactivity (analytics, insights, settings) push this to 200+ kB.

---

## 2. React Render Analysis

### High-Risk Components

| Component | Risk | Reason |
|---|---|---|
| `AIPromptPanel.tsx` | 🔴 High | 6 useState + 8 useEffect — heavy re-render surface. Multiple hooks coordinating template, auth, lead data, streaming |
| `FunnelBuilderDashboard.tsx` | 🟠 Medium | Nested collapsible sections with dynamic rendering |
| `WorkforceDashboard.tsx` | 🟠 Medium | useQuery + useMutation with cascading updates |
| `BrandDNAStudio.tsx` | 🟡 Low | 1 suppressed exhaustive-deps warning |
| `AccountSetupStep.tsx` | 🟡 Low | 1 suppressed exhaustive-deps warning |

### Missing Optimizations

| Technique | Current Usage | Opportunity |
|---|---|---|
| `React.memo` | 0 found | Wrap pure presentational components (CopyButton, Field, Section) |
| `useMemo` | 2 found (AIPromptPanel) | Add to expensive derived state in dashboard components |
| `useCallback` | 2 found | Add to callback props in list renders |
| Suspense boundaries | **0 found** | Add to data-fetching pages (dashboard, analytics, CRM) |
| `next/dynamic` | **1 found** (FunnelPreview) | Lazy-load below-fold components (FunnelResult, heavyweight editors) |

---

## 3. Dynamic Import Opportunities

Current usage: Only 1 — `FunnelPreview` in `funnel/[id]/edit`.

### Candidates for `next/dynamic`

| Component | Bundle Impact | Notes |
|---|---|---|
| `FunnelResult` (279 lines) | ~15 kB | Only renders after AI generation completes |
| `FunnelBuilderDashboard` | ~10 kB | Only shown when user visits specific page |
| `WorkforceDashboard` | ~8 kB | Only shown on `/ai-workforce` |
| `ContentHistory` | ~5 kB | Below-fold on content pages |
| Chart.js imports (analytics) | ~30 kB | Load only when analytics tab is active |
| QR code library (ShareFunnelDialog) | ~15 kB | Load only when share dialog opens |

**Estimated savings:** Lazy-loading these 6 components would reduce first-load JS by ~40–60 kB across affected routes.

---

## 4. Suspense Boundaries

**Current: 0 found in the entire codebase.**

### Recommended Additions

| Location | Purpose |
|---|---|
| `app/(auth)/layout.tsx` | Wrap main content slot |
| `app/(auth)/dashboard/page.tsx` | Wrap heavy stats section |
| `app/(auth)/crm/[id]/page.tsx` | Wrap lead detail sections |
| `app/(auth)/funnel/[id]/analytics/page.tsx` | Wrap chart sections |

---

## 5. API Latency Risks

### Sequential Prisma Queries (N+1 Risk)

| Service | Issue | Risk |
|---|---|---|
| `funnel-progress-service.ts` | 5 sequential Prisma queries + 1 user lookup | 🟠 Medium — could parallelize further |
| `ai-router/aiModelRouter.ts` | tenant lookup → policy → providers → fallback (sequential) | 🟡 Low — necessary for logic flow |
| `lead-analysis-service.ts` | lead query → template lookup → 2x router.generate | 🟡 Low — AI calls dominate |
| `content-plan-service.ts` | Single large AI call (30-day calendar) | 🟠 Medium — 2,500 avg tokens, may timeout on cheap models |

### Heavy Prisma Queries

| Query | Location | Concern |
|---|---|---|
| `prisma.funnel.findMany` with `include: { template }` | funnel-service.ts | Template relation eagerly loaded even when not displayed |
| `prisma.lead.findUnique` with `include: { tags, activities, notes }` | lead-analysis-service.ts | Loads all related data even for simple views |
| `prisma.user.findUnique` with `select: { metadata: true }` | multiple services | JSONB field `metadata` loaded entirely even when only one key needed |

---

## 6. Supabase/Prisma Query Optimizations

### Quick Wins

| # | Optimization | Impact |
|---|---|---|
| 1 | Add `select` fields to `funnelService.list()` — exclude full `config` JSONB when listing | ~30% query size reduction |
| 2 | Use `take` instead of loading all related records (`include: { tags: { take: 10 } }`) | Prevents over-fetching |
| 3 | Cache tenant settings in memory (TTL 60s) — `getRouterForTenant()` queries Prisma on every AI call | ~5ms per AI request |
| 4 | Batch quota checks — `enforceQuota()` counts all logs each time | Could use a counter cache |
| 5 | Add database indexes for hot queries: `tenantId + status`, `ownerId + createdAt` | Speedup on funnel/lead listings |

---

## 7. Server Action / API Bottlenecks

| API Route | Risk | Issue |
|---|---|---|
| `POST /api/v1/ai/generate/world-class-funnel` | 🔴 High | 35s timeout + multiple AI calls — client must wait |
| `POST /api/v1/ai/generate/content/stream` | 🟢 Low | Already uses SSE streaming |
| `POST /api/v1/ai/generate/content-plan` | 🟠 Medium | 30-day calendar generation is compute-heavy |
| `PUT /api/v1/funnel/funnels/[id]` | 🟡 Low | Config validation on every save |

### Recommendation
- Add background job queue (e.g., Inngest, QStash) for heavy AI generations (world-class-funnel)
- Return immediately with a `jobId`, poll for completion
- Halves perceived latency for the funnel builder page

---

## 8. Top 20 Performance Risks

| # | Risk | Category | Severity | Fix Effort |
|---|---|---|---|---|
| 1 | Funnel analytics page: 241 kB first load | Bundle | 🔴 Critical | Medium |
| 2 | No Suspense boundaries anywhere | Render | 🔴 Critical | Low |
| 3 | World-class funnel: 35s blocking API | API | 🔴 Critical | High |
| 4 | `FunnelResult` loads eagerly (279 lines) | Bundle | 🟠 High | Low |
| 5 | `getRouterForTenant()` queries Prisma on every AI call | Query | 🟠 High | Low |
| 6 | `quota.enforceQuota()` counts all-time logs per call | Query | 🟠 High | Medium |
| 7 | Missing `React.memo` on shared components | Render | 🟠 High | Low |
| 8 | `AIPromptPanel`: 6 useState + 8 useEffect | Render | 🟠 High | Medium |
| 9 | Shared JS chunk: 103 kB on every page | Bundle | 🟠 High | High |
| 10 | `funnelService.list()` loads full JSONB config | Query | 🟠 High | Low |
| 11 | Chart.js loads eagerly on analytics pages | Bundle | 🟠 High | Medium |
| 12 | QR code lib loads with ShareFunnelDialog | Bundle | 🟡 Medium | Low |
| 13 | `agent-manager`: sequential agent execution | API | 🟡 Medium | Medium |
| 14 | No `useCallback` on list render callbacks | Render | 🟡 Medium | Low |
| 15 | `metadata` JSONB loaded entirely for single key | Query | 🟡 Medium | Low |
| 16 | Lead detail loads all relations eagerly | Query | 🟡 Medium | Low |
| 17 | Template include on every funnel list query | Query | 🟡 Medium | Low |
| 18 | `BrandDNAStudio` suppressed deps warning | Render | 🟡 Low | Low |
| 19 | `next/dynamic` used only once in whole app | Bundle | 🟡 Low | Low |
| 20 | No image optimization for user-uploaded funnel images | Assets | 🟡 Low | Low |

---

## 9. Estimated Improvement Potential

| Category | Quick Wins | Medium Effort | Total Potential |
|---|---|---|---|
| Bundle size | −20 kB | −40 kB | **−60 kB** (25% reduction on shared chunk) |
| Render performance | −15% re-renders | −30% re-renders | Noticeable on dashboard/CRM |
| API latency | −5ms per AI call | −30s for funnel gen | Background jobs eliminate timeout risk |
| Query efficiency | −20% data transfer | −40% data transfer | Faster list pages |

### Priority Quick Wins (Week 1)

1. Add `React.memo` to CopyButton, Section, Field, BulletList (5 min each)
2. Add `next/dynamic` for FunnelResult, WorkforceDashboard, ContentHistory (10 min each)
3. Cache tenant router settings (30 min)
4. Reduce `funnelService.list()` payload by excluding config JSONB (15 min)
5. Add Suspense boundary to dashboard layout (10 min)
