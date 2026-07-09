# OS 3.3 Runtime Readiness Report

Version: 1.0

Status: Review Gate Complete

Last Updated: 2026-07-09

Branch: `review/os-3.3-runtime-readiness`

Base Branch: `planning/os-3.3-runtime-platform`

---

## Purpose

Assess whether NextShift OS is ready to begin Runtime Integration.

This is a read-only architecture assessment. It does not approve production release, create a tag, merge code, or authorize implementation work.

---

## Executive Conclusion

NextShift OS is ready to begin Runtime Integration only as a scoped pilot, not as a broad platform-wide integration.

The repository has strong package foundations in `packages/domain`, `packages/application`, `packages/runtime`, and `packages/decision-brain`. It also has several useful `src/` projection adapters and revenue-routing seams that can be integrated safely. However, the `src/` application surface remains highly coupled to Prisma, Next.js routes, auth middleware, telemetry, and module-local services. Several package layers also expose broad alpha APIs with uneven test coverage.

Recommended gate decision:

```text
CONDITIONAL GO - Start a narrow Runtime Integration pilot.
```

The first pilot should target Revenue Drivers as a runtime capability adapter because it is small, mostly deterministic, already tested, and has low data-migration risk.

---

## Overall Readiness

| Area | Score | Assessment |
| --- | ---: | --- |
| Package foundation readiness | 76 / 100 | Strong domain/application/runtime foundations with clear exports and tests. |
| Runtime integration readiness | 68 / 100 | Runtime primitives are mature, but package-to-Next.js integration seams are not yet standardized. |
| `src/` integration readiness | 58 / 100 | Useful candidates exist, but coupling to Prisma and service graphs raises risk. |
| Documentation readiness | 70 / 100 | OS 3.3 planning and package docs exist, but runtime package README coverage is uneven. |
| Test readiness | 74 / 100 | Domain/application/runtime/decision-brain have strong tests; business-brain and several layer packages have no real tests. |

Overall readiness score:

```text
69 / 100
```

---

## Subsystem Readiness Scores

### `packages/domain`

Score: 86 / 100

| Dimension | Result |
| --- | --- |
| API maturity | High. Broad public exports for analytics, revenue, business-brain, command-center, content, campaign, CRM, and related aggregates. |
| Test coverage | High. 42 test files cover many aggregate and repository boundaries. |
| Coupling | Low. Depends on `@nextshift/shared` and `@nextshift/contracts`; no direct Prisma or Next.js dependency observed. |
| Runtime dependencies | Low. Mostly pure domain model and in-memory repositories. |
| Public exports | Broad and stable enough for pilot integration, though export breadth increases review burden. |
| Documentation completeness | Good package README plus OS 3.3 release docs. |

Readiness: Strong foundation for runtime integration.

### `packages/application`

Score: 82 / 100

| Dimension | Result |
| --- | --- |
| API maturity | High. Exposes use-case services, commands, queries, repositories, ports, and many capability application services. |
| Test coverage | High. 45 test files cover analytics, business-brain, campaign, content, CRM, revenue, dashboard-related and v1 package services. |
| Coupling | Medium. Correctly depends on domain/shared/contracts, but public surface is large. |
| Runtime dependencies | Low to medium. Package itself avoids direct database ownership, but integration into `src/` will need adapters. |
| Public exports | Broad and useful; integration should pick narrow service slices rather than importing the full index. |
| Documentation completeness | Good README; package-level service docs are mostly code-based. |

Readiness: Ready for selected integration through narrow ports.

### `packages/runtime`

Score: 78 / 100

| Dimension | Result |
| --- | --- |
| API maturity | Medium-high. Runtime context, kernel, event, session, workspace, permission, diagnostics, and capability primitives are explicit. |
| Test coverage | High for size. 8 test files cover runtime primitives. |
| Coupling | Low. Runtime package is pure TypeScript and does not depend on application packages. |
| Runtime dependencies | Low. No database or framework coupling observed. |
| Public exports | Clear index exports by runtime area. |
| Documentation completeness | Weak. No package README was found for `packages/runtime`. OS runtime-platform docs exist separately. |

Readiness: Ready as the technical substrate, but needs documented integration contracts before broad adoption.

### `packages/decision-brain`

Score: 72 / 100

| Dimension | Result |
| --- | --- |
| API maturity | Medium. Context, recommendation, strategy, opportunity, risk, prioritization, and conversation engines expose clean ports. |
| Test coverage | Good. 7 test files cover engine behavior. |
| Coupling | Low. Depends on shared/contracts only. |
| Runtime dependencies | Low. No direct database or framework dependency observed. |
| Public exports | Clean and bounded. |
| Documentation completeness | Good README, but README notes real recommendation logic is not fully implemented yet. |

Readiness: Ready for recommendation-style pilots, not yet a full decision authority.

### `packages/business-brain`

Score: 52 / 100

| Dimension | Result |
| --- | --- |
| API maturity | Medium. BusinessBrain class implements contract-oriented profile flows and event publishing. |
| Test coverage | Low. Package test script is `echo "No tests yet"`. |
| Coupling | Medium. Depends on domain, contracts, shared, and event-bus. |
| Runtime dependencies | Low to medium. Uses in-memory stores by default and event publisher ports, but behavior is under-tested. |
| Public exports | Broad for context/profile/twin/memory/story/knowledge. |
| Documentation completeness | Honest README, including non-responsibilities and not-yet-full Business Twin logic. |

Readiness: Not a first integration target. Needs tests before runtime-critical use.

### `src/`

Score: 58 / 100

| Dimension | Result |
| --- | --- |
| API maturity | Mixed. API routes and adapters exist, but module contracts vary widely. |
| Test coverage | Medium. Many service tests exist; coverage is uneven across modules and several DB-bound tests require environment guards. |
| Coupling | High. Many services directly import Prisma, auth middleware, telemetry, workspace context, and other module services. |
| Runtime dependencies | High. Next.js request/response, Prisma, auth, and tenant context are common. |
| Public exports | Mixed. Some modules expose clear constants/adapters; others expose service objects directly. |
| Documentation completeness | Mixed. Product docs exist, but source-level integration contracts are limited. |

Readiness: Use only narrow, well-tested seams for the first runtime integration.

---

## Runtime Readiness Findings

### Strengths

- `packages/runtime` provides pure runtime primitives with explicit lifecycle and metadata validation.
- `packages/domain` and `packages/application` have substantial tests and clear aggregate/application service boundaries.
- `packages/decision-brain` has a small, understandable public API and good unit coverage.
- `src/modules/analytics/adapters/AnalyticsProjectionAdapter.ts` and `src/modules/dashboard/adapters/DashboardProjectionAdapter.ts` already act like integration seams.
- `src/modules/revenue-drivers` is route/intent oriented, deterministic, and tested.

### Gaps

- `packages/runtime` lacks a package README despite being the runtime substrate.
- `packages/business-brain`, `packages/agents`, `packages/capability-layer`, `packages/contracts`, `packages/execution-layer`, and `packages/learning-system` currently have "No tests yet" scripts.
- `src/modules/dashboard/adapters/DashboardProjectionAdapter.ts` imports a large graph of services and Prisma directly, increasing blast radius.
- `src/modules/business-intelligence/ceoAdvisorEngine.ts` is highly coupled to Prisma and BrandContextProvider.
- `src/modules/analytics/analyticsService.ts` still mixes Prisma reads, projection composition, KPI calculation, and legacy fallback values.

---

## Runtime Risk Matrix

| Target | Risk | Breaking Change Risk | Dependency Risk | Migration Effort | Rollback Difficulty | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `src/modules/dashboard/adapters/DashboardProjectionAdapter.ts` | High | High | High | High | High | Pulls many services, Prisma, mission authority, business memory, execution, workforce, analytics, and product experience. |
| `src/modules/business-intelligence/ceoAdvisorEngine.ts` | High | Medium | High | High | Medium | Direct Prisma and BrandContext dependency; acts as a broad decision generator. |
| `src/modules/mission-engine` | High | High | High | High | High | DB-bound mission service and authority layer; already needed test environment guard. |
| `src/modules/analytics/analyticsService.ts` | Medium | Medium | Medium | Medium | Medium | Has clear projection adapter but service still owns Prisma and legacy KPI shaping. |
| `packages/business-brain` | Medium | Medium | Medium | Medium | Medium | Important architecture role but no package tests yet. |
| `packages/application` selected services | Medium | Medium | Low | Medium | Medium | Good tests, but broad public API; integrate slice-by-slice. |
| `packages/domain` selected aggregates | Low | Low | Low | Low | Low | Strong test coverage and pure domain boundaries. |
| `packages/runtime` primitives | Low | Medium | Low | Low | Low | Runtime primitives are pure and tested; risk is mostly adoption contract churn. |
| `src/modules/revenue-drivers` | Low | Low | Low | Low | Low | Constants and intent resolver are deterministic, tested, and easy to roll back. |

---

## Recommended First Integration Point

Highest priority first integration:

```text
Revenue Drivers Runtime Capability Adapter
```

Suggested files to integrate first:

- `src/modules/revenue-drivers/constants/revenue-drivers.ts`
- `src/modules/revenue-drivers/constants/revenue-driver-intents.ts`
- `src/app/api/v1/revenue-drivers/intent/route.ts`
- `src/__tests__/services/revenue-drivers.test.ts`

Why this is the easiest first integration:

- It satisfies the preferred Revenue category.
- It is small and deterministic.
- It has existing tests.
- It does not require database migration for the core decision logic.
- It maps product intent to runtime-capability style concepts: driver, action, route, intent, resolution status.
- It can be wrapped in runtime context/capability metadata without reshaping the entire application.
- Rollback is straightforward because it can be introduced as a parallel adapter.

---

## Highest Risk Integration Target

Highest risk target:

```text
Dashboard Projection Runtime Integration
```

Reason:

`DashboardProjectionAdapter` is a valuable long-term target, but it currently imports many service layers and Prisma-backed dependencies. Runtime integration here would immediately touch mission authority, business state, journey state, COO planning, growth loop, optimization, activation, retention, value, user success, expansion, referral, analytics, memory, execution, workforce, product experience, telemetry, and Prisma. A failure would affect the main dashboard experience.

Dashboard should become the second or third integration target after Revenue Drivers proves the runtime adapter pattern.

---

## Go / No-Go

| Decision Area | Result |
| --- | --- |
| Broad Runtime Integration | NO-GO |
| Scoped Runtime Integration Pilot | GO |
| Production Promotion | NO-GO |
| Tag Creation | NO-GO |
| First Target | Revenue Drivers |
| Next Candidate | Analytics Projection Adapter |
| Highest Risk Target | Dashboard Projection Adapter |

---

## Recommended Review Gate Outcome

Proceed to Runtime Integration only if Phase 3 defines:

1. A narrow runtime adapter contract.
2. A non-invasive pilot target.
3. A rollback plan.
4. A test gate that includes package tests and the relevant `src` unit tests.
5. A rule that no runtime integration may directly introduce production database migrations.
