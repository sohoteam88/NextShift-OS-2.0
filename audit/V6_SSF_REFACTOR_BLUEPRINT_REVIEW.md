# V6 SSOT Refactor Blueprint Review

## Summary

The blueprint matches the codebase reality.

The current system is feature-rich but architecturally fragmented across:
- multiple progression systems
- multiple mission selectors
- multiple CRM surfaces
- multiple Team surfaces

The blueprint's central direction is correct:
- stop feature expansion
- consolidate authority
- keep one write source, one read source, one projection layer per domain

## What The Blueprint Gets Right

### Evolution
- `userProgress` and `user-evolution` are the right canonical direction.
- Legacy role gates and duplicate unlock logic should be removed or reduced to presentation-only checks.

### Mission
- Mission truth is currently split across `missionService`, `missionEngineService`, `activation-service`, `growth-roadmap-service`, `getNextJourneyAction`, and `ai-coach-service`.
- This domain needs one canonical mission authority and one projection layer.

### CRM
- The live CRM already exists, but `crm-engine` is still a parallel surface.
- The blueprint is correct to keep the live CRM services and remove the legacy engine.

### Team
- `teamService` is the live authority for hierarchy and metrics.
- `leaderDashboardService` is a projection over it, not a second authority.
- `team-engine` is the legacy overlap that should be removed.

## Gaps In The Blueprint

### 1. It does not define the canonical read contracts
The blueprint says "one read authority" and "one projection layer," but it does not define the exact DTOs that Dashboard, Journey, CRM, and Team should consume.

That matters because the current breakage is often contract mismatch, not just duplicated logic.

### 2. It does not define migration boundaries
Several legacy systems are still in production:
- `missionEngineService`
- `crm-engine`
- `team-engine`
- dashboard hooks that assume richer summary payloads than the API returns

The blueprint should explicitly separate:
- keep as-is for now
- convert to adapter
- remove in sprint X

### 3. It does not define which admin views are canonical projections
Admin pages currently read from `workspaceHealthService`, which overlaps with team and CRM counts.
The blueprint should state whether admin pages become:
- projections over canonical domain services, or
- separate workspace-level aggregates with explicit ownership

## Recommended Execution Order

### Sprint 1: Evolution consolidation
- Make `user-evolution` the only progression source.
- Convert role gates into access checks only.
- Remove duplicate level computation from UI consumers.

### Sprint 2: Mission consolidation
- Make `missionService` the single mission authority.
- Turn `missionEngineService`, `activation-service`, `growth-roadmap-service`, `getNextJourneyAction`, and `ai-coach-service` into adapters or remove them.
- Ensure Dashboard and Journey consume one canonical mission projection.

### Sprint 3: CRM consolidation
- Keep `leadService`, `followupService`, `pipelineService`, `crmCenterService`.
- Remove `crm-engine`.
- Make CRM pages consume one canonical read model.

### Sprint 4: Team consolidation
- Keep `teamService`.
- Keep `leaderDashboardService` only as a projection.
- Move admin org metrics to shared projections over `teamService`.
- Remove `team-engine`.

### Sprint 5: Business flow wiring
- Wire Lead -> CRM -> Opportunity -> Revenue -> Team.
- Add event, automation, and audit trail for every handoff.

### Sprint 6: Legacy cleanup
- Remove legacy engines and obsolete projections after all canonical consumers have migrated.

## Team-Specific Recommendation

For Team, the canonical structure should be:

- **Write authority**: `teamService`-backed mutations and member/invite approval flows
- **Read authority**: `teamService` derived projections
- **Projection layer**: `leaderDashboardService` and admin workspace projections

`team-engine` should not survive as a parallel authority.

## Final Assessment

This blueprint is ready to become the implementation roadmap.

It is directionally correct, but it should be tightened before execution by defining:
- canonical DTOs
- migration boundaries
- projection ownership
- deprecation order for each legacy engine

Without those details, the refactor will still risk partial duplication during the migration window.

