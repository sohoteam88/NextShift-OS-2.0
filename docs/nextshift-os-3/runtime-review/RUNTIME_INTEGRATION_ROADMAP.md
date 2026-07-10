# OS 3.3 Runtime Integration Roadmap

Version: 1.0

Status: Review Gate Complete

Last Updated: 2026-07-09

Branch: `review/os-3.3-runtime-readiness`

---

## Purpose

Provide a recommended Runtime Integration roadmap based on current repository readiness.

This roadmap is advisory. It does not start implementation, approve production release, create tags, or merge changes.

---

## Roadmap Principle

Start with the smallest deterministic source seam that can prove runtime context, capability metadata, event emission, and rollback without touching production schema or core dashboard behavior.

---

## Phase R0 - Runtime Integration Contract

Goal:

Define the minimum contract for adapting current `src/` modules into runtime capabilities.

Required decisions:

- Runtime context shape.
- Runtime capability identity shape.
- Event emission conventions.
- Error and rollback behavior.
- Test gate for every runtime adapter.
- Rule that first-pass runtime integration must not require database migrations.

Suggested package anchors:

- `@nextshift/runtime`
- `@nextshift/domain`
- `@nextshift/application`
- `@nextshift/event-bus`

Exit criteria:

- Contract is documented.
- First pilot target is approved.
- Rollback strategy is documented.

---

## Phase R1 - Revenue Drivers Pilot

Goal:

Wrap Revenue Drivers as the first runtime capability.

Candidate files:

- `src/modules/revenue-drivers/constants/revenue-drivers.ts`
- `src/modules/revenue-drivers/constants/revenue-driver-intents.ts`
- `src/app/api/v1/revenue-drivers/intent/route.ts`
- `src/__tests__/services/revenue-drivers.test.ts`

Why first:

- Low coupling.
- Existing tests.
- No schema migration needed.
- Natural runtime concepts: driver, action, intent, tool, route, status.
- Easy rollback.

Expected output:

- Runtime capability metadata for revenue-driver actions.
- Runtime context wrapper for intent resolution.
- Optional event emission for resolved/invalid/fallback intent.

Validation gate:

- Existing revenue-driver tests pass.
- Runtime package tests pass.
- No production migration.

---

## Phase R2 - Analytics Projection Pilot

Goal:

Adapt analytics projection into runtime context after R1 proves the pattern.

Candidate files:

- `src/modules/analytics/adapters/AnalyticsProjectionAdapter.ts`
- `src/modules/analytics/analyticsService.ts`
- `src/__tests__/services/analytics-projection-adapter.test.ts`

Why second:

- Clear projection adapter already exists.
- Unit tests cover business-state, journey-state, and growth-loop projection consumption.
- Business value is high but risk is manageable if adapter-only.

Risk controls:

- Do not rewrite analytics service storage.
- Do not change Prisma reads.
- Keep legacy analytics center fields intact.
- Add runtime wrapper beside existing adapter.

---

## Phase R3 - Narrow Dashboard Projection Integration

Goal:

Integrate only the safest read-only dashboard projection subset.

Candidate files:

- `src/modules/dashboard/adapters/DashboardProjectionAdapter.ts`
- `src/app/api/v1/dashboard/projection/route.ts`
- `src/__tests__/services/dashboard-projection-adapter.test.ts`

Why not first:

- The dashboard adapter imports a large graph of services.
- It touches user-facing core dashboard behavior.
- Rollback is harder than Revenue Drivers or Analytics.

Risk controls:

- Start with runtime metadata around current projection output.
- Avoid changing query behavior.
- Do not change mission, journey, business-state, or Prisma dependencies in the first pass.
- Add contract tests before replacing internals.

---

## Phase R4 - Application Package Service Bridge

Goal:

Bridge selected `@nextshift/application` services into runtime context.

Best candidates:

- Revenue application service.
- Analytics application service.
- Revenue target/progress/forecast services.

Why:

- Application package has strong tests and explicit command/query contracts.
- Revenue and analytics map naturally to runtime capability execution and read models.

Risk controls:

- Import selected services directly, not the full application index.
- Keep adapters thin.
- Preserve existing repository ports.

---

## Phase R5 - Decision Brain Runtime Hooks

Goal:

Expose recommendation and prioritization outputs through runtime capability context.

Candidate package:

- `@nextshift/decision-brain`

Why later:

- Package tests exist and API is clean.
- README says real recommendation logic is not fully implemented yet.

Risk controls:

- Treat outputs as advisory.
- Do not promote to final business authority.
- Keep human-readable reasoning separate from execution approval.

---

## Phase R6 - Business Brain Runtime Integration

Goal:

Connect Business Brain after tests and contract confidence improve.

Candidate package:

- `@nextshift/business-brain`

Prerequisites:

- Add package tests.
- Confirm Business Twin contract maturity.
- Decide event-bus behavior.
- Define persistence adapter boundary.

Why later:

- Business Brain is central to architecture, but current package test script is `echo "No tests yet"`.
- A weak Business Brain runtime integration would make later decisions harder to trust.

---

## Phase R7 - Execution, Agents, Capability Layer, Learning System

Goal:

Integrate execution and learning only after runtime context, eventing, dashboard read models, and decision hooks are stable.

Deferred packages:

- `@nextshift/execution-layer`
- `@nextshift/agents`
- `@nextshift/capability-layer`
- `@nextshift/learning-system`

Why deferred:

- These packages have no real tests yet.
- They depend on multiple upstream layers.
- They increase rollback difficulty.
- They are closer to action execution, where runtime governance must be mature.

---

## Recommended Priority

1. Runtime Integration Contract.
2. Revenue Drivers Runtime Capability Adapter.
3. Analytics Projection Runtime Adapter.
4. Narrow Dashboard Projection Runtime Metadata.
5. Application Revenue/Analytics Service Bridge.
6. Decision Brain Runtime Recommendation Hooks.
7. Business Brain Runtime Integration.
8. Execution, Agents, Capability Layer, and Learning System.

---

## Stop Conditions

Stop Runtime Integration if any of the following occur:

- Runtime adapter requires production schema change.
- Runtime adapter changes user-facing dashboard behavior before tests are added.
- Package tests fail.
- `src` tests require unguarded production-like environment variables.
- Rollback path is unclear.
- Integration requires broad imports from package root indexes where narrow imports are available.

---

## Recommended Next Step

Before implementation begins, create a Phase 3 Governance Slimdown brief that defines the Runtime Integration Contract and limits the first implementation slice to Revenue Drivers.
