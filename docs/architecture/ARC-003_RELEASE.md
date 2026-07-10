# ARC-003 Release

Version: 3.1  
Release Status: RELEASED  
Release Date: 2026-06-30

## Summary

ARC-003 Engine Context Refactor has passed Implementation, Verification, and the Claude Code Architecture Audit. It is officially released as part of the **NextShift OS 3.1 runtime baseline**, transitioning Workspace Context from infrastructure readiness into engine-level execution.

## Released Deliverables

- ARC-003 Engine Context Refactor
- Request-level Workspace Context resolution (`request-workspace-context.ts`)
- Normalized engine context utility (`workspace-engine-context.ts`)
- Request-level context wiring into 13 primary shared-engine routes
- Lead Magnet and Traffic optional Workspace Context support
- Residual `track` / `businessMode` inventory
- Operator reference inventory
- Implementation Report, Codex Implementation Report, Verification Checklist, Audit Report

## Lifecycle Results

- Implementation: PASS
- Verification: PASS
- Audit: PASS
- Release: COMPLETE

## Compatibility

- ARC-001 / ARC-002 architecture baselines preserved (AR-001 / AR-002 / AR-003)
- Platform Foundation, Design System, and CAP-001 through CAP-008 preserved
- Public service signatures backward compatible (`workspaceId` / `workspaceContext` / `track` optional)
- Legacy Single Business Flow remains default

## Open Items (Carried Forward)

- Operator-to-Member RBAC migration (Finding A) — dedicated future slice.
- `businessMode` consolidation under Workspace Config (Finding B) — next cleanup priority.
- Residual `track` metadata migration (Finding C) — staged with metadata shape.
- Workspace-aware persistence — dedicated database migration phase.

## Release Decision

ARC-003 is officially released as part of the OS 3.1 runtime baseline.

## Next Phase

Operator-to-Member RBAC Migration and businessMode Consolidation

Focus:

- Member + WorkspaceMembership + Role RBAC migration
- businessMode-to-WorkspaceConfig consolidation
- Incremental request-level context coverage
- Workspace persistence migration planning
