# V6 Migration Contract Review

## Summary

This migration contract is structurally sound.

It fixes the biggest problem in the current system: legacy engines cannot be deleted before consumers are moved onto canonical DTOs.

The contract also matches the right sequencing:
- consumers first
- adapters before deletion
- authorities removed last
- rollback support on every sprint

That is the correct migration shape for this codebase.

## What The Contract Gets Right

### 1. It enforces DTO-first migration
This is necessary because the current app still has consumers reading from mixed sources.

### 2. It makes legacy systems temporary adapters only
That is the correct rule for:
- `missionEngineService`
- `crm-engine`
- `team-engine`

### 3. It treats dashboards as projections only
This is the right rule for:
- Dashboard
- Journey
- AI Coach
- Admin

### 4. It defines deprecation conditions
The deletion gate is correct:
- all consumers migrated
- tests pass
- production verification passes
- no route imports remain
- no API imports remain

## Where The Contract Conflicts With Current Reality

### Evolution
The contract says `userEvolutionService` is the target authority and `EvolutionAdapter` should normalize role, unlock, and userProgress state.

That is directionally correct, but current runtime still has multiple consumers deriving level from different inputs.

### Mission
The contract says `missionService` becomes the single authority.

That is correct, but today the app still splits mission truth across:
- `missionService`
- `missionEngineService`
- activation logic
- roadmap logic
- journey-action logic
- AI coach selectors

So the adapter layer is not optional. It is required.

### CRM
The contract says CRM should be written by:
- `leadService`
- `followupService`
- `pipelineService`
and read by `crmCenterService`.

That matches the live CRM direction.

However, the current codebase still has a legacy `crm-engine` surface in production, and `crmCenterService` is not yet the only consumer-facing read model.

### Team
The contract says `teamService` is the single authority and `leaderDashboardService` is not an authority.

That matches the live Team architecture.

The only caveat is that admin metrics still use `workspaceHealthService`, which currently re-derives overlapping team/org truth.

## Main Gaps In The Contract

### 1. It does not specify adapter ownership boundaries
The contract names adapters, but it does not say which module owns them.

That matters because the migration will fail if every consumer starts inventing its own local adapter.

### 2. It does not define DTO versioning rules
You need a clear rule for:
- backward-compatible DTO extension
- when DTO fields may be removed
- when a legacy consumer is allowed to keep a fallback

Without that, migration will stall on shape drift.

### 3. It does not define admin projection ownership clearly enough
The contract forbids `workspaceHealthService` from recalculating truth, which is correct.

But it does not say what replaces it:
- a shared projection package
- domain-owned read models
- or a dedicated admin projection service

That decision needs to be explicit before implementation starts.

### 4. It assumes Revenue has a clean canonical service already
The contract defines `RevenueSnapshot` and `revenueProjectionService`, but the current codebase is not yet at the same maturity for Revenue as it is for Team or CRM.

So Revenue should be treated as a later-stage dependency, not part of the first migration wave.

## Recommended Approval Notes

Approve this contract only with the following clarifications added:

1. Each adapter must live in the canonical domain module, not in consumer pages.
2. DTOs must be versioned and backward-compatible for one migration window.
3. Admin projections must have an explicit owning service or shared projection layer.
4. Revenue is out of scope for the first consolidation sprint unless its authority model is defined separately.

## Final Assessment

This is a good migration contract.

It is strict enough to prevent another round of hidden truth systems, but it still needs a few operational details before implementation starts:
- adapter ownership
- DTO versioning
- admin projection ownership
- revenue scope boundaries

Once those are fixed, the contract is ready to drive the V6 refactor sequence.

