# ARC-002 Workspace Context Architecture

Version: 1.0  
Status: Released — OS 3.1 Runtime Baseline

## Purpose

ARC-002 upgrades the Platform Kernel from ARC-001 into a fully Workspace-aware runtime architecture while preserving backward compatibility.

## Objectives

- Workspace Repository
- Workspace Registry
- Workspace Manifest
- Workspace Context Provider
- Workspace Context Resolver
- Context Injection
- Shared Engine Integration

## Runtime Flow

```text
Member
  |
Workspace Repository
  |
Workspace Resolver
  |
Workspace Context
  |
Workspace Registry
  |
Shared Engines
```

## Workspace Context

Contains:

- workspaceId
- workspaceType
- memberId
- membership
- role
- permissions
- capabilities
- templateNamespace
- themeKey

## Repository

WorkspaceRepository exposes:

- findById()
- findByMember()
- listMemberships()
- findDefaultWorkspace()

## Manifest

Each workspace defines:

- Navigation
- Dashboard
- Templates
- Prompts
- Capabilities
- Analytics Profile
- CRM Profile
- Theme

## Engine Rule

Shared engines only.

```ts
engine.execute(input, workspaceContext);
```

No RetailEngine or RecruitmentEngine implementations are allowed.

## Validation

- Typecheck PASS
- Lint PASS
- Tests PASS
- Build PASS
- No duplicated modules
- No duplicated engines
- No Design System regression

## Exit Criteria

Workspace-aware runtime established.

Ready for ARC-003 Engine Context Refactor.

## Implementation Status

ARC-002 runtime foundation is implemented in `src/modules/workspace`.

Implemented:

- Workspace Repository with `findById()`, `findByMember()`, `findDefaultWorkspace()`, and `listMemberships()`.
- Workspace Registry resolving configuration, navigation, dashboard profile, capability profile, theme, template namespace, and prompt profile.
- Workspace Manifest registry for initial retail and recruitment workspaces.
- Workspace Context direct fields for workspace identity, member identity, membership, role, permissions, capabilities, template namespace, theme key, and prompt profile.
- Backward-compatible aliases for existing `activeWorkspaceId`, `activeWorkspaceType`, `activeMembership`, and existing module context fields.
- Context injection into Content Engine, CRM, Funnel Builder, Landing Page generation/publish flow, Analytics, AI Coach, and AI COO decision memory.

Implementation report:

- [ARC-002 Codex Implementation Report](../audit/ARC_002_CODEX_IMPLEMENTATION_REPORT.md)
