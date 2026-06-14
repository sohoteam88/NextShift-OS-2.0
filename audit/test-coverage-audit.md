# Phase 6A — Test Coverage Audit

**Date:** 2026-06-14  
**Scope:** Full codebase test coverage assessment  
**Status:** Audit complete

---

## Current Test Suite

| Type | Tool | Files | Coverage Area |
|---|---|---|---|
| Unit/Integration | Vitest | 12 | Security (5), isolation (6), mission-engine (1) |
| E2E | Playwright | 6 | Auth, admin, brand-discovery, content-engine, funnel-context, mission-engine |
| **Total** | | **18** | |

### Test Inventory

**Vitest (`src/__tests__/`):**

| Test | Area | Module |
|---|---|---|
| `security/auth.test.ts` | Auth flows | auth |
| `security/headers.test.ts` | HTTP headers | middleware |
| `security/rate-limiting.test.ts` | Rate limiting | middleware |
| `security/input-validation.test.ts` | Input sanitization | api |
| `security/rbac.test.ts` | Role-based access | auth |
| `isolation/analytics-isolation.test.ts` | Tenant isolation | analytics |
| `isolation/funnel-isolation.test.ts` | Tenant isolation | funnel |
| `isolation/lead-isolation.test.ts` | Tenant isolation | crm |
| `isolation/user-isolation.test.ts` | Tenant isolation | auth |
| `isolation/ai-isolation.test.ts` | Tenant isolation | ai |
| `isolation/note-activity-isolation.test.ts` | Tenant isolation | crm |
| `mission-engine/mission-engine.test.ts` | Mission logic | mission |

**Playwright (`tests/e2e/`):**

| Test | Page/feature |
|---|---|
| `auth.spec.ts` | Login/register flows |
| `admin.spec.ts` | Admin dashboard |
| `brand-discovery.spec.ts` | Brand discovery wizard |
| `content-engine.spec.ts` | Content generation |
| `funnel-context.spec.ts` | Funnel context dashboard |
| `mission-engine.spec.ts` | Mission system |

---

## Module Coverage Estimate

| Module | Source Files | Tests (approx) | Coverage | Risk |
|---|---|---|---|---|
| **funnel** | 62 | 1 (isolation) + 0 (unit) + 1 (e2e) | ~3% | 🔴 |
| **ai** | 60 | 1 (isolation) + 0 (unit) + 1 (e2e) | ~3% | 🔴 |
| **crm** | 36 | 2 (isolation) + 0 (unit) + 0 (e2e) | ~5% | 🔴 |
| **dashboard** | 8 | 0 + 0 + 0 | 0% | 🔴 |
| **admin** | 19 | 0 + 0 + 1 (e2e) | ~5% | 🟠 |
| **member** | 15 | 0 + 0 + 0 | 0% | 🔴 |
| **brand-dna** | 7 | 0 + 0 + 1 (e2e) | ~14% | 🟠 |
| **auth** | 5 | 2 (unit) + 1 (e2e) | ~50% | 🟡 |
| **middleware** | — | 2 (unit) | ✅ (partial) | 🟡 |

---

## API Route Coverage

| Category | Routes | Tests | Coverage |
|---|---|---|---|
| `/api/v1/funnel/*` | 13 | 0 | 0% 🔴 |
| `/api/v1/ai/*` | 18 | 0 | 0% 🔴 |
| `/api/v1/crm/*` | 17 | 0 | 0% 🔴 |
| `/api/v1/admin/*` | 8 | 0 | 0% 🔴 |
| `/api/v1/member/*` | 12 | 0 | 0% 🔴 |
| `/api/v1/brand-builder/*` | 22 | 0 | 0% 🔴 |
| `/api/v1/auth/*` | 3 | 2 (unit) | ~66% 🟡 |
| Other | ~78 | 0 | 0% 🔴 |
| **Total** | **171** | **2** | **~1%** |

---

## High-Risk Untested Services

### 🔴 Critical — Zero Tests, High Business Impact

| Service | Module | Risk | Reason |
|---|---|---|---|
| `funnel-service.ts` (CRUD) | funnel | HIGH | All funnel CRUD, quota enforcement, slug generation, access control |
| `funnel-health-service.ts` | funnel | HIGH | Consolidated health scoring for 3 engines |
| `funnel-builder-service.ts` (AI) | ai | HIGH | 916-line world-class funnel generator with fallbacks |
| `funnel-builder-service.ts` (deterministic) | funnel | HIGH | Deterministic funnel generation with DB writes |
| `content-service.ts` | ai | HIGH | Content generation pipeline (quota→template→router→validate→log) |
| `lead-analysis-service.ts` | ai | HIGH | Lead scoring with AI analysis |
| `ai-request-router.ts` | ai | HIGH | Single entry point for all AI calls |
| `agent-manager.ts` | ai | HIGH | Multi-agent execution orchestration |
| `crm-center service` | crm | HIGH | Lead/customer pipeline management |
| `whatsapp-reply-service.ts` | ai | HIGH | CRM WhatsApp reply generation |

### 🟠 High — Zero Tests, Moderate Impact

| Service | Module | Risk |
|---|---|---|
| `cost-estimator.ts` | ai | Cost estimation logic |
| `model-policy-engine.ts` | ai | Plan-based model gating |
| `fallback-handler.ts` | ai | Retry + provider failover |
| `quality-gate-service.ts` | funnel | Content quality/de-duplication |
| `template-service.ts` (both) | funnel + ai | Template CRUD × 2 |
| `agent-memory.ts` | ai | Agent execution history |
| `workforce-orchestrator.ts` | ai | Goal-based agent routing |

---

## Recommended Test Priorities

### Priority 1 — Critical Path (Week 1)

| # | Test | Type | Module |
|---|---|---|---|
| 1 | `funnel-service.test.ts` | Unit | funnel |
| 2 | `funnel-health-service.test.ts` | Unit | funnel |
| 3 | `ai-request-router.test.ts` | Unit | ai |
| 4 | `content-service.test.ts` | Unit | ai |
| 5 | API smoke tests: funnel CRUD | Integration | funnel |
| 6 | API smoke tests: AI generate endpoints | Integration | ai |

### Priority 2 — Business Logic (Week 2)

| # | Test | Type | Module |
|---|---|---|---|
| 7 | `funnel-builder-service.test.ts` | Unit | ai |
| 8 | `lead-analysis-service.test.ts` | Unit | ai |
| 9 | `agent-manager.test.ts` | Unit | ai |
| 10 | CRM lead pipeline tests | Unit | crm |
| 11 | `cost-estimator.test.ts` | Unit | ai |
| 12 | `model-policy-engine.test.ts` | Unit | ai |

### Priority 3 — Integration + E2E (Week 3–4)

| # | Test | Type |
|---|---|---|
| 13 | Funnel builder E2E (create→publish→view) | Playwright |
| 14 | AI content generation E2E | Playwright |
| 15 | Multi-tenant isolation E2E | Playwright |
| 16 | Admin operations E2E | Playwright |

---

## Production Risk Score

| Category | Score | Notes |
|---|---|---|
| API route coverage | **1/171 (~1%)** | 🔴 Critical |
| Business logic coverage | **~3%** | 🔴 Critical |
| E2E coverage | 6 pages of ~100+ | 🟠 High |
| Security testing | ✅ Covered (5 tests) | 🟢 Good |
| Tenant isolation | ✅ Covered (6 tests) | 🟢 Good |
| **Overall** | **~2%** | 🔴 |

### Risk Assessment

The codebase has strong **security** and **isolation** testing but near-zero coverage of business logic and API routes. The funnel and AI domains — which just underwent major architectural consolidation — have effectively no functional tests. A regression in funnel CRUD, AI routing, or health scoring would go undetected until hitting production.

**Recommendation:** Prioritize unit tests for the 10 critical services listed above before any new feature work.
