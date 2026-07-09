# OS 3.3 Integration Priority

Version: 1.0

Status: Review Gate Complete

Last Updated: 2026-07-09

Branch: `review/os-3.3-runtime-readiness`

---

## Purpose

Rank package and source integration candidates for OS 3.3 Runtime Integration based on current repository state.

This document intentionally does not follow the historical roadmap when current repository evidence points to a safer order.

---

## Scoring Model

Each package is scored across:

- Stable public API
- Test maturity
- Documentation
- Runtime safety
- Integration complexity

Higher score means better first-integration readiness.

---

## Package Integration Ranking

| Rank | Package | Score | Public API | Tests | Docs | Runtime Safety | Complexity | Assessment |
| ---: | --- | ---: | --- | --- | --- | --- | --- | --- |
| 1 | `@nextshift/domain` | 86 | Strong | Strong | Good | High | Medium | Best canonical business model foundation. |
| 2 | `@nextshift/application` | 82 | Strong | Strong | Good | Medium-high | High | Best use-case layer, but integrate slice-by-slice. |
| 3 | `@nextshift/runtime` | 78 | Good | Good | Weak | High | Medium | Runtime primitives are ready; docs should be improved before broad rollout. |
| 4 | `@nextshift/decision-brain` | 72 | Good | Good | Good | High | Medium | Good for recommendation pilots; real logic still limited. |
| 5 | `@nextshift/shared` | 70 | Good | Small | Good | High | Low | Safe support package, not a product-facing target. |
| 6 | `@nextshift/event-bus` | 68 | Good | Small | Good | Medium-high | Medium | Useful for runtime events after adapter pattern is proven. |
| 7 | `@nextshift/runtime-core` | 66 | Small | Small | Missing | High | Low | Small runtime-core package; docs gap limits confidence. |
| 8 | `@nextshift/runtime-adapters` | 62 | Small | Small | Missing | Medium-high | Medium | Good later bridge package; not enough depth for first target alone. |
| 9 | `@nextshift/runtime-orchestrator` | 61 | Small | Small | Missing | Medium | Medium | Candidate after runtime adapter contracts stabilize. |
| 10 | `@nextshift/workspace-runtime` | 60 | Small | Small | Missing | Medium | Medium | Useful once workspace runtime semantics are required. |
| 11 | `@nextshift/ui` | 58 | Broad | Good | Missing | Medium | High | UI test coverage exists, but runtime integration should not start here. |
| 12 | `@nextshift/contracts` | 56 | Broad | None | Good | Medium-high | Medium | Important dependency, but no tests. |
| 13 | `@nextshift/business-brain` | 52 | Medium | None | Good | Medium | Medium | Architecturally important but under-tested. |
| 14 | `@nextshift/agents` | 38 | Medium | None | Good | Low-medium | High | Depends on many layers; too early. |
| 15 | `@nextshift/execution-layer` | 37 | Medium | None | Good | Low-medium | High | Execution integration should wait for runtime pilot. |
| 16 | `@nextshift/capability-layer` | 36 | Medium | None | Good | Low-medium | High | Too many upstream dependencies for first integration. |
| 17 | `@nextshift/learning-system` | 35 | Medium | None | Good | Low-medium | High | Last-stage integration; depends on execution learning loops. |

---

## Top Package Integration Candidates

1. `@nextshift/domain`
2. `@nextshift/application`
3. `@nextshift/runtime`
4. `@nextshift/decision-brain`
5. `@nextshift/event-bus`

Recommended usage:

- Use `@nextshift/runtime` for context/capability/session primitives.
- Use `@nextshift/domain` for stable business language.
- Use selected `@nextshift/application` services as use-case boundaries.
- Use `@nextshift/decision-brain` only for recommendation-style pilots, not as final decision authority.
- Use `@nextshift/event-bus` after the first runtime adapter proves lifecycle events.

---

## Source Integration Candidates

| Rank | Candidate | Score | Risk | Why |
| ---: | --- | ---: | --- | --- |
| 1 | Revenue Drivers | 84 | Low | Deterministic route/intent mapping, existing tests, no migration requirement. |
| 2 | Analytics Projection Adapter | 76 | Medium | Clear adapter boundary with tests; still calls business/journey/growth services. |
| 3 | Revenue package/application services | 74 | Medium | Strong package services exist; `src` product surface is thinner than analytics/dashboard. |
| 4 | Dashboard projection subset | 61 | High | High business value, but service graph is large. |
| 5 | Business Intelligence CEO Advisor | 48 | High | Direct Prisma and BrandContext coupling; broad generated decision surface. |

---

## Recommended First Source Target

First integration target:

```text
Revenue Drivers
```

Target scope:

- Intent resolver
- Driver definitions
- Mission-to-driver route mapping
- Runtime capability metadata wrapper
- Optional audit event adapter

Non-goals for the first pass:

- No Prisma schema changes
- No production migration
- No dashboard rewrite
- No mission engine rewrite
- No business-brain/decision-brain authority replacement

---

## Recommended OS 3.3 Priority Order

Based on current repository state:

1. Define Runtime Capability Adapter Contract.
2. Integrate Revenue Drivers as the first runtime capability pilot.
3. Add runtime event emission around Revenue Driver resolution.
4. Integrate Analytics Projection Adapter as the second pilot.
5. Integrate a narrow Dashboard Projection read model after analytics proves stable.
6. Connect selected `@nextshift/application` revenue/analytics services to runtime context.
7. Introduce `@nextshift/decision-brain` recommendation runtime hooks.
8. Add `@nextshift/business-brain` only after package tests exist.
9. Defer execution-layer, agents, capability-layer, and learning-system integration until runtime adapter and rollback patterns are proven.

---

## Deferred Targets

| Target | Reason to defer |
| --- | --- |
| Dashboard full projection | Too coupled and user-facing for first integration. |
| Mission Engine | DB-bound and already has environment-sensitive tests. |
| Business Intelligence CEO Advisor | Direct Prisma and broad decision generation. |
| Agents | Depends on application, domain, event-bus, business-brain, and execution behavior. |
| Learning System | Needs execution telemetry and stable event semantics first. |
