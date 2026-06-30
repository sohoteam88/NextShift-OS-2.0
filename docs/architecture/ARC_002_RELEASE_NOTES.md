# ARC-002 Release Notes

Version: 1.0  
Status: Released  
Release Date: 2026-06-30

## Release

**ARC-002 -- Workspace Context Architecture**

This release upgrades the ARC-001 Platform Kernel into a Workspace-aware runtime foundation while preserving backward compatibility. Workspace state is resolved through manifests and configuration rather than business-specific code.

ARC-002 is officially released following successful implementation, verification, and architecture audit. The Claude Code architecture audit concluded with an overall PASS, confirming compliance with ARC-001 architecture rules, preservation of backward compatibility, and no duplicated engines, modules, or pages.

## Highlights

### Workspace Runtime

- Workspace Repository introduced (interface + in-memory adapter + legacy adapter).
- Manifest-backed Workspace Registry implemented.
- Workspace Manifest support added for retail and recruitment configurations.
- `WorkspaceContext` expanded with identity, membership, role, permissions, capabilities, template namespace, theme key, and prompt profile.
- Backward-compatible aliases preserved for existing context fields.

### Identity

- Member remains the single authenticated identity.
- No Operator model introduced in the workspace runtime.
- Workspace Membership preserved.

### Shared Engine Strategy

Optional `workspaceContext` injection added to shared paths without duplication:

- Content Engine
- CRM
- Analytics
- AI Coach
- Funnel / Funnel Builder
- Landing generation and publish
- AI COO decision memory

No RetailEngine or RecruitmentEngine implementations were introduced.

## Compatibility

This release preserves:

- Platform Foundation
- Design System
- CAP-001 through CAP-008
- Existing public APIs and services
- Legacy Single Business Flow (default when no workspace is resolved)

## Validation

- Type Check: PASS (exit 0)
- Workspace Unit Tests: PASS (6 tests)
- Full Suite: 57 passed / 1 failed / 7 skipped (311 tests passed)
- Lint: PASS (existing warnings only)
- Build: PASS (existing warnings only)

Known limitation:

The single failing suite (`mission-engine.test.ts`) is blocked by a pre-existing local PostgreSQL dependency at `127.0.0.1:5432` and is not an ARC-002 regression.

## Audit Outcome

ARC-002 passed the Claude Code Architecture Audit with a PASS decision. Two non-blocking findings were recorded — legacy `operator` RBAC role and pre-existing `track`-based content branching — both pre-dating ARC-002 and carried forward to ARC-003. See [ARC-002 Audit Report](../audit/ARC_002_AUDIT_REPORT.md).

## Next Phase

**ARC-003 -- Engine Context Refactor**

Focus:

- Request-level Workspace Context resolution for API and page entry points
- Consistent context injection into all shared engines
- Operator-to-Member legacy cleanup
- Consolidation of legacy `track`-based branching under workspace configuration
- Workspace-aware persistence preparation

## Release Decision

**RELEASE APPROVED**

ARC-002 becomes part of the official NextShift OS 3.1 runtime baseline.
