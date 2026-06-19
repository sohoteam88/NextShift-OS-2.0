# Phase 8A V7 Authority Migration Master Plan Review

## Verdict

Direction is correct.

This document is the right next artifact after:

- [ADR_016_V7_SYSTEM_ARCHITECTURE_REVIEW.md](/Users/stevenmacmini/Documents/Codex/2026-06-05/skills/NextShift-OS-2.0/audit/ADR_016_V7_SYSTEM_ARCHITECTURE_REVIEW.md)
- [ADR_017_V7_MIGRATION_GOVERNANCE_REVIEW.md](/Users/stevenmacmini/Documents/Codex/2026-06-05/skills/NextShift-OS-2.0/audit/ADR_017_V7_MIGRATION_GOVERNANCE_REVIEW.md)

ADR-016 defined the architecture law.
ADR-017 defined the migration law.
This Phase 8A document now tries to define the migration inventory and wave plan.

That is the right sequence.

My conclusion:

`APPROVE AS EXECUTION-PLANNING DIRECTION, BUT TIGHTEN THE INVENTORY AND WAVE DEPENDENCIES BEFORE TREATING IT AS THE OPERATING PLAN`

## What This Plan Gets Right

### 1. It understands that inventory comes before migration

This line is correct:

```text
No code migration begins before this inventory is complete.
```

That is the right discipline.

Given the repo history, trying to migrate V7 authorities without first mapping:

- current sources
- current consumers
- target projection
- retirement path

would recreate the same parallel-authority problems V6 spent time cleaning up.

### 2. It follows the correct migration pattern

This sequence is correct:

```text
Source Authority
-> Projection
-> Consumer Migration
-> Reference Audit
-> Retirement
```

That matches the governance rule already established in ADR-017 and the actual successful pattern used in V6 evolution consolidation.

This is the right backbone.

### 3. The six-layer inventory structure matches the V7 stack

The plan maps inventory directly onto:

- Interview Authority
- Business State
- Journey Engine
- AI COO
- Agent Runtime
- Growth Loop

That is correct.

It keeps the migration plan aligned with the canonical architecture instead of falling back into feature-by-feature planning.

### 4. The required deliverables are the right deliverables

This section is strong:

- Source Inventory
- Consumer Inventory
- Projection Contract
- Retirement Plan
- Closure Report

That is the right minimum package for each authority migration.

If all five exist, the migration has a real chance of being auditable.

## Why This Plan Matters In This Codebase

This repo is large enough now that V7 cannot be migrated from memory or intuition.

Several of the targeted authorities already have fragmented current-state logic:

- Interview truth is split across interview runtime, `BrandProfile`, and metadata
- Business diagnosis is spread across funnel, dashboard, and business-intelligence logic
- Journey is mixed between `missionService`, dashboard helpers, and journey maps
- AI recommendation logic exists across coach routes, panels, and domain recommenders
- Runtime execution already exists in `ai-workforce` and agent manager surfaces
- Optimization logic already exists across CEO advisor, brand advisor, and health projections

So a master inventory is necessary.

Without it, migration sequencing will be driven by local convenience instead of authority boundaries.

## Main Architectural Strength

The strongest part of the plan is that it treats Phase 8A as planning and inventory, not implementation.

That is the correct call.

At this point, the most dangerous mistake would be to start coding upper-layer migrations while lower-layer inventories are still incomplete.

This plan avoids that.

## Main Risks

### 1. The current authority inventory is still too shallow

The listed current sources are directionally right, but still incomplete for real execution.

Examples:

- Interview Authority is not only `brandInterviewService`, `BrandProfile`, metadata, and routes; it also has extraction logic, slot logic, and downstream brand-discovery assumptions
- Business State is likely broader than funnel health, funnel progress, dashboard readiness, and business-intelligence scoring
- Journey is not just `missionService`, `journey-map`, `getNextJourneyAction`, and dashboard helpers; there are likely route/API/state consumers too
- Growth Loop is broader than only CEO advisor, recommendation engines, brand advisor, and health projections

So this inventory is a valid start, but not yet a complete migration map.

### 2. Wave ordering is mostly right, but still too loose

Current waves:

- Wave 1: Journey Authority / Mission Authority
- Wave 2: AI COO / Recommendation Authority
- Wave 3: Agent Runtime / Workforce Systems
- Wave 4: Growth Loop / Optimization Systems

This is close, but incomplete.

The biggest issue is that the plan does not explicitly place:

- Interview Authority inventory closure
- Business State inventory closure

ahead of the downstream migrations.

That matters because:

- AI COO cannot be canonical before Journey is canonical
- Journey should not be stabilized before Business State inputs are defined
- Business State should not be stabilized before Interview-derived context boundaries are known

So the dependency order needs to be stricter than the current wave names imply.

### 3. "Audit Required" and "High Priority" are not enough as status values

These labels are too soft for an operating plan.

The plan needs statuses that correspond to decision gates, such as:

- inventory not started
- source mapped
- consumers mapped
- projection defined
- ready for migration
- migration in progress
- ready for retirement
- closed

Without that, progress tracking will be ambiguous.

### 4. Exit criteria are correct, but still too phase-level and not authority-level

This is correct:

- all authorities identified
- all consumers identified
- migration sequence approved

But the plan should also require that each authority row eventually owns:

- named current sources
- named consumers
- projection owner
- migration dependencies
- retirement evidence

Otherwise Phase 8A can be declared complete while the inventory is still too thin to drive Phase 8B safely.

## What Must Be Tightened

### 1. Add Layer 1 and Layer 2 explicitly to the wave/dependency order

The plan should make the dependency chain explicit:

1. Interview Authority inventory
2. Business State inventory
3. Journey inventory and migration planning
4. AI COO inventory and migration planning
5. Agent Runtime inventory and migration planning
6. Growth Loop inventory and migration planning

That does not mean implementation must finish strictly one by one, but it does mean upstream authority contracts must be known before downstream migration starts.

### 2. Expand each authority row into a real planning table

Each authority should eventually include at least:

- current source authorities
- known runtime consumers
- target projection or state contract
- blocking dependencies
- candidate retirement mode
- evidence artifact path

Right now the rows are still too compressed.

### 3. Separate "recommendation authority" from "optimization authority" more carefully

Wave 2 currently includes:

- AI COO Authority
- Recommendation Authority

That wording is risky.

Based on the V7 stack:

- AI COO owns delegation
- Growth Loop owns optimization recommendations

So "recommendation authority" should not be treated as a separate long-term authority class.

It should be broken down into:

- recommendation surfaces to be absorbed into AI COO
- optimization recommendation surfaces to be absorbed into Growth Loop

Otherwise the plan quietly introduces a fuzzy seventh category.

### 4. Define the required proof for "inventory complete"

Since this is a planning phase, the closure rule should say what evidence completes Phase 8A.

For example:

- every authority has a source inventory document
- every authority has a consumer inventory document
- every authority has a named target projection
- dependency order is approved
- no unmapped legacy authority remains in runtime scope

That is stronger than the current wording and easier to audit.

## Recommended Execution Order

The safer order for this plan is:

1. Complete Interview Authority inventory
2. Complete Business State inventory
3. Complete Journey Authority inventory
4. Complete AI COO inventory
5. Complete Agent Runtime inventory
6. Complete Growth Loop inventory
7. Approve final dependency graph
8. Only then begin actual authority migration

That order matches the architecture stack and reduces rework.

## Final Judgment

This is the right master-plan document to create now.

It correctly shifts Phase 8A into:

- inventory
- dependency mapping
- migration sequencing

instead of premature implementation.

That is the right move.

My final judgment:

`APPROVE AS PHASE-PLANNING DIRECTION`

But before using it as the active execution plan, tighten:

- the authority inventory depth
- the upstream dependency order
- the status model
- the definition of "inventory complete"

Once those are clarified, this plan will be strong enough to govern the next phase of V7 migrations.
