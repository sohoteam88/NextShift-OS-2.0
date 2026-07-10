# V6 Implementation Governance Review

## Summary

This governance layer is the right kind of document for this refactor.

It turns the V6 target architecture into enforceable operating rules:
- one authority per domain
- one DTO per domain
- one projection layer per domain
- adapters must live inside domains
- dashboards may not become authorities

That is the correct shape for preventing another truth split.

## What The Governance Gets Right

### 1. It removes ambiguity about ownership
The contract is explicit:
- evolution owns `userEvolutionService`
- mission owns `missionService`
- CRM owns the live write services plus `crmCenterService`
- Team owns `teamService`

### 2. It treats adapters as domain assets
This is important.

Adapters belong in the domain package, not in routes, pages, hooks, or dashboards.
That prevents the most common migration failure: local one-off adapters that quietly become new authorities.

### 3. It blocks projection drift
The governance is correct that projections may read and format, but may not recalculate business truth.

### 4. It formalizes versioning and rollback
The versioning rules are good:
- add fields only during active migration
- no renames
- no removals
- support current and previous version during one migration cycle

### 5. It adds production enforcement
The contract’s release and verification rules are useful because this system already has history of “looks fine in code, diverges in runtime.”

## Where It Still Needs Refinement

### 1. Domain ownership pathing is a convention, not a hard enforcement
The document names owners like `src/modules/team`, but the repo still contains mixed legacy surfaces.

That means governance needs to be paired with linting or route-level assertions, otherwise it remains policy rather than enforcement.

### 2. Revenue is still only partially specified
The governance introduces Revenue sprints and a health dashboard, but the actual revenue authority is still not defined as cleanly as evolution, mission, CRM, and Team.

So Revenue should not be treated as solved by this document alone.

### 3. Admin projection ownership needs one explicit service boundary
The new `AdminProjectionService` idea is good, but it needs a single module owner and an explicit input contract.

Otherwise admin may become a second projection system with its own truth drift.

### 4. The architecture health dashboard is missing from the current runtime
`/admin/system-truth` is the right enforcement surface, but it does not yet exist in the current app tree.

That means the governance is ahead of the codebase, which is fine, but it should be tracked as a required deliverable for the refactor.

## Current Runtime Conflicts With This Governance

### Evolution
The app still has duplicate progression and unlock logic across UI consumers.

### Mission
The app still mixes `missionService`, `missionEngineService`, activation, roadmap, and journey-action logic.

### CRM
The app still has a live CRM plus a legacy `crm-engine` surface.

### Team
The app still has `teamService`, `leaderDashboardService`, `workspaceHealthService`, and `team-engine`.

### Admin
Admin pages currently compute and display overlaps rather than consuming a dedicated canonical projection service.

## Recommended Implementation Notes

### Add hard guardrails
This governance should be backed by:
- import restrictions
- route-level contract tests
- snapshot validation for DTOs
- verification tests for admin projections

### Make `/admin/system-truth` a required milestone
That page should expose:
- authority status
- projection status
- remaining legacy consumers
- feature flag state

### Keep the sprint order fixed
The governance’s sprint order is correct:
1. Evolution
2. Mission
3. CRM
4. Team
5. Revenue authority audit
6. Revenue consolidation
7. Legacy cleanup

Do not parallelize authority consolidation across domains unless the DTO boundaries are already stable.

## Final Assessment

This is a strong governance layer.

It is strict enough to prevent backsliding, and it aligns with the canonical architecture and migration contract.

The only real risk is that it remains a policy document unless the repo adds enforcement:
- import checks
- DTO version tests
- route consumer tests
- admin projection verification

With those guardrails, this governance can actually hold the refactor in place.
