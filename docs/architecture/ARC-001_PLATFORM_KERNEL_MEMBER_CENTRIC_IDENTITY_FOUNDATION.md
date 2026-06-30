# ARC-001 Platform Kernel & Member-Centric Identity Foundation

Version: 3.1  
Status: Released — Architecture Baseline (Frozen)

## Purpose

ARC-001 establishes the architectural foundation for NextShift OS 3.1.

This phase upgrades the platform from a Single Business Operating System into a Multi-Business Workspace Platform without breaking existing Platform Foundation, Design System, or CAP-001 through CAP-008.

No UI redesign is included in this phase.

## Core Vision

One Platform.

One AI Brain.

One Business Memory.

Multiple Business Workspaces.

One Engine, Multiple Workspace Configurations.

## Immutable Architecture Rules

### AR-001 Member-Centric Identity

Only one authenticated identity exists:

**Member**

Operator is removed from the platform architecture.

Business differences are represented by Workspace.

Permission differences are represented by Role.

Access differences are represented by Workspace Membership.

### AR-002 No Engine Duplication

The platform must never introduce:

- Retail CRM Engine
- Recruitment CRM Engine
- Retail Content Engine
- Recruitment Content Engine

All business systems consume the same engine layer.

### AR-003 Configuration Over Customization

Business behaviour must be resolved using:

- Workspace Registry
- Workspace Resolver
- Template Resolver
- Capability Registry

Never through hardcoded business branches.

## Core Domain Model

```text
Platform
-> Tenant
-> Workspace
-> Member
-> Business Memory
-> Shared Engine Layer
```

These five objects form the permanent foundation of NextShift OS.

## Identity Model

```text
Tenant
-> Workspace
-> Member
-> Role
-> Permission
```

There are no Operator, Retail User, Recruitment User, or Admin User identities.

## Workspace Domain

Introduce:

- Workspace
- WorkspaceId
- WorkspaceType
- WorkspaceStatus
- WorkspaceConfiguration
- WorkspaceCapability
- WorkspaceMembership
- WorkspaceContext

Initial workspace types:

- retail
- recruitment

Architecture must support unlimited future workspace types.

## Platform Registries

### Workspace Registry

Responsible for:

- Navigation
- Dashboard
- Theme
- Capabilities
- Templates

### Engine Registry

Responsible for:

- Engine resolution
- Template resolution
- Prompt resolution

### Capability Registry

Responsible for enabling existing platform capabilities without duplication.

## Platform Resolvers

- Workspace Resolver
- Permission Resolver
- Template Resolver

Business engines consume resolved context instead of business-specific logic.

## Shared Engine Layer

Single implementations only:

- Content Engine
- CRM Engine
- Funnel Engine
- Landing Engine
- Analytics Engine
- Workflow Engine
- AI Coach Engine
- AI COO

Required pattern:

```ts
engine.execute(input, workspaceContext);
```

## Database Direction

Introduce architectural support for:

- workspace
- workspace_id
- workspace_type
- workspace_members

Every future business object should become workspace-aware.

Migration must be backward compatible.

## Backward Compatibility

- Preserve Platform Foundation.
- Preserve Design System.
- Preserve CAP-001 through CAP-008.
- Legacy records resolve through a default workspace.
- Existing APIs remain functional.

## Architecture Guardrails

Never:

- Duplicate modules
- Duplicate pages
- Duplicate engines
- Introduce Operator
- Hardcode workspace business logic inside engines

Always:

- Reuse engines
- Resolve through context
- Configure through registries
- Extend through workspace manifests

## Deliverables

- Workspace Domain
- Workspace Context
- Workspace Registry
- Workspace Resolver
- Engine Context Skeleton
- Database Evolution Plan
- Migration Plan
- Implementation Report

## Validation Checklist

- No duplicated engines
- No duplicated pages
- No duplicated modules
- Member-only identity model
- Workspace-centric architecture
- Shared AI Brain
- Shared Business Memory
- Backward compatibility
- Type safety
- Passing lint
- Passing typecheck
- Passing unit tests
- Passing build

## Next Phase

ARC-002 Workspace Context Architecture

Focus:

- Workspace Context Provider
- Workspace Switcher
- Routing Context
- Capability Resolution
- Engine Context Integration
