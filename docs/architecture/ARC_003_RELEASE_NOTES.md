# ARC-003 Release Notes

Version: 1.0  
Status: Released  
Release Date: 2026-06-30

## Release

**ARC-003 -- Engine Context Refactor**

This release moves Workspace Context from infrastructure readiness into engine-level execution. Request-level Workspace Context resolution is centralized and propagated into the primary shared-engine routes, while the legacy Single Business Flow remains the default when no workspace is resolved.

ARC-003 is officially released following successful implementation, verification, and architecture audit. The Claude Code architecture audit concluded with an overall PASS, confirming continued compliance with the ARC-001/ARC-002 architecture rules, no duplicated engines or modules, and preserved backward compatibility. The non-blocking ARC-002 audit findings were carried forward, inventoried, and scoped for a focused future migration.

## Highlights

### Engine Context

- Centralized request-level Workspace Context resolution (`request-workspace-context.ts`).
- Normalized engine context utility (`workspace-engine-context.ts`).
- Resolution from `x-workspace-id` header, `workspaceId` query/body, and legacy track fallback.

### Shared Engine Integration

Request-level Workspace Context propagated into 13 primary routes across:

- Content Engine
- CRM
- Analytics
- Funnel / Landing
- Lead Magnet
- Traffic
- AI Coach
- AI COO

No engine resolves workspace independently; no Retail/Recruitment engine forks were introduced.

### Legacy Refactor

- Residual `track` usage isolated to legacy request fields and stored metadata; Workspace Config overrides where context exists.
- Residual `businessMode` usage documented and deferred (affects downstream projection contracts).
- Legacy `operator` references inventoried; no new Operator references introduced.

## Compatibility

This release preserves:

- Platform Foundation
- Design System
- CAP-001 through CAP-008
- Existing public APIs and services
- Legacy `track` inputs and Single Business Flow (default when no workspace is resolved)

## Validation

- Type Check: PASS (exit 0)
- Workspace Unit Tests: PASS (8 tests)
- Full Suite: 57 passed / 1 failed / 7 skipped (313 tests passed)
- Lint: PASS (existing warnings only)
- Build: PASS (existing warnings only)

Known limitation:

The single failing suite (`mission-engine.test.ts`) is blocked by a pre-existing local PostgreSQL dependency at `127.0.0.1:5432` and is not an ARC-003 regression.

## Audit Outcome

ARC-003 passed the Claude Code Architecture Audit with a PASS decision. Findings A (legacy Operator RBAC), B (residual `businessMode`), and C (residual `track`) are non-blocking, inventoried, and carried forward. See [ARC-003 Audit Report](../audit/ARC_003_AUDIT_REPORT.md).

## Next Phase

**Operator-to-Member RBAC Migration** and **`businessMode` Consolidation** (focused future architecture slices)

Focus:

- Migrate legacy `operator` RBAC semantics toward Member + WorkspaceMembership + Role.
- Consolidate residual `businessMode` projection logic under Workspace Config / Manifest.
- Extend request-level Workspace Context to remaining routes incrementally.
- Plan workspace-aware persistence as a dedicated migration phase.

## Release Decision

**RELEASE APPROVED**

ARC-003 becomes part of the official NextShift OS 3.1 runtime baseline.
