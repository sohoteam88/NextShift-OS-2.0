# ARC-006 Release Notes

Version: 1.0  
Status: Released  
Release Date: 2026-07-01

## Release

**ARC-006 -- Workspace Presentation Layer Rendering**

This release connects the shared presentation layer to Workspace Registry metadata, closing the deferred presentation-layer gap identified in the ARC-004 and ARC-005 audits. Retail and Recruitment Business OS experiences now render distinct navigation, dashboard widgets, templates, AI profile metadata, and business capabilities through shared, registry-driven renderers.

ARC-006 is officially released following successful implementation, verification, and architecture audit. The Claude Code architecture audit concluded with an overall PASS, confirming single shared renderers with no page/module/renderer/engine forks and preserved backward compatibility.

## Highlights

### Shared Presentation Model

- New `workspace-presentation.ts` resolves navigation, dashboard widgets, templates, business capabilities, and AI/AI-COO profiles exclusively from the Workspace Registry.
- `useOptionalWorkspaceContext` lets shared renderers safely no-op when no workspace provider is present.

### Shared Renderers (no forks)

- `WorkspaceTopNavigation` — renders registry navigation for the active workspace.
- `WorkspaceDashboardMetadata` — renders widgets, capabilities, templates, and AI profile.
- `WorkspaceSwitcher` — switches active workspace via provider state.
- Integrated into the shared `TopBar` and `DashboardHome`; `WorkspaceProvider` mounted in the authenticated layout.

### Runtime Behavior

- Retail and Recruitment render distinct experiences from metadata only.
- Existing routes, dashboard sections, TopBar execution roadmap, and access control are preserved.

## Compatibility

This release preserves:

- Existing routes and page modules
- CAP-001 through CAP-008 behavior
- Existing access control and permission checks
- Design System (token-based styling, shared primitives)
- Legacy fallback (renderers no-op without workspace context)

## Validation

- Type Check: PASS (exit 0)
- Workspace Unit Tests: PASS (12 tests)
- Full Suite: 57 passed / 1 failed / 7 skipped (317 tests passed)
- Lint: PASS (existing warnings only)
- Build: PASS (existing warnings only)

Known limitation:

The single failing suite (`mission-engine.test.ts`) is blocked by a pre-existing local PostgreSQL dependency at `127.0.0.1:5432` and is not an ARC-006 regression.

## Audit Outcome

ARC-006 passed the Claude Code Architecture Audit with a PASS decision. Findings: (A) workspace switching is client-state only pending persistence; (B) no browser/visual QA performed. Both non-blocking and documented. See [ARC-006 Audit Report](../audit/ARC_006_AUDIT_REPORT.md).

## Next Phase

With ARC-006 released, NextShift OS 3.1 now includes:

- Platform Kernel
- Workspace Context Architecture
- Engine Context Refactor
- Retail Business OS
- Recruitment Business OS
- Shared Presentation Layer

The first end-to-end Dual Business Workspace Architecture is complete.

Recommended priority:

1. Workspace Persistence Migration
2. Operator-to-Member RBAC Migration
3. `businessMode` Consolidation
4. Production Readiness Review

Focus:

- Server-backed active workspace persistence (resolves Finding A).
- Browser/Playwright visual smoke for Retail vs Recruitment rendering (Finding B).
- Operator-to-Member RBAC migration and `businessMode` consolidation.

## Release Decision

**RELEASE APPROVED**

ARC-006 Workspace Presentation Layer Rendering is released on the NextShift OS 3.1 platform baseline.
