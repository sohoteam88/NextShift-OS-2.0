# V6 Canonical Architecture Review

## Summary

This architecture definition is directionally correct.

It matches the current audit findings:
- evolution is split across multiple authorities
- mission is split across multiple selectors and projections
- CRM has a live operational surface plus a legacy engine
- Team has a live service plus legacy and admin overlays

The blueprint is useful as a target state, but it is not yet the current runtime architecture.

## What Already Matches Reality

### Single authority principle
The rule set is correct:
- one write authority
- one read authority
- one projection layer

That is the right consolidation model for this codebase.

### Team
The document is right to choose `teamService` as the canonical Team authority and `leaderDashboardService` as a projection only.

### CRM
The document is right to keep `leadService`, `followupService`, `pipelineService`, and `crmCenterService`, and remove `crm-engine`.

### Mission
The document is right that mission truth should collapse onto a single service and projection path.

## Where The Blueprint Is Strong But Still Incomplete

### 1. Canonical DTOs are defined, but not wired to current contracts
The DTOs are sensible, but the current app does not yet consume them.

Examples:
- `DashboardV4` still reads team summary data through a hook that expects more fields than `/api/v1/team/summary` returns.
- Mission consumers still derive state from multiple inputs.
- CRM has both a canonical command center and a legacy engine surface.

The blueprint needs an explicit adapter plan for each DTO.

### 2. It assumes domain boundaries are already clean
They are not.

Current overlaps still exist:
- `missionService` vs `missionEngineService`
- `crmCenterService` vs `crm-engine`
- `teamService` vs `team-engine`
- `workspaceHealthService` as an admin-wide overlay that partially duplicates CRM and Team aggregations

### 3. It does not define migration ownership for admin surfaces
Admin pages currently read from shared workspace health projections.
The blueprint says "admin metrics must consume teamService through shared projections," which is the right goal, but it should explicitly say whether admin views remain:
- workspace-level aggregates, or
- pure domain projections

Without that, admin pages will keep re-deriving truth.

## Current Reality Check By Domain

### Evolution
The architecture target is valid, but current consumers still mix:
- `userProgress`
- user evolution level logic
- lock/unlock checks

The consolidation target should be `user-evolution` as the only level authority.

### Mission
The blueprint correctly wants one mission source, but today the app still mixes:
- `missionService`
- `missionEngineService`
- `activation` state
- roadmap logic
- journey action logic
- AI coach interpretation

This needs the strictest migration order because it affects Dashboard, Journey, and AI Coach at once.

### CRM
The canonical CRM direction is right, but the current runtime still exposes a legacy CRM engine surface.

`crmCenterService` is the right read model candidate.

### Team
This is the cleanest part of the blueprint.

`teamService` is the real data authority.
`leaderDashboardService` is a projection.
`team-engine` is the legacy overlap.

That part of the blueprint aligns with the codebase almost exactly.

## Recommended Execution Order

### 1. Evolution consolidation
This should go first.
If progression remains split, every other domain will keep inheriting inconsistent permissions and unlock behavior.

### 2. Mission consolidation
Second priority.
Mission drives Dashboard, Journey, AI Coach, and activation flows, so it needs one canonical selector before the rest can converge.

### 3. CRM consolidation
Third priority.
This domain already has the strongest live service set, so it is a practical consolidation candidate.

### 4. Team consolidation
Fourth priority.
This should mostly be read-model cleanup and removal of the legacy `team-engine`.

### 5. Revenue wiring
Only after the above are stable.
Revenue is currently a target concept in the architecture, not a fully canonical service boundary in the live app.

### 6. Legacy cleanup
Remove old engines and obsolete projections only after the canonical consumers are migrated.

## Final Assessment

The blueprint is a good architecture target, but it still needs a migration contract.

What is missing:
- explicit DTO-to-UI mapping
- clear adapter ownership
- deprecation sequence for legacy engines
- a rule for when admin projections are allowed to diverge from domain projections

Net: the direction is correct, but execution still needs to be staged carefully to avoid another layer of hidden truth.

