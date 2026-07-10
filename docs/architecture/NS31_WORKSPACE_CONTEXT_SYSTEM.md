# NS31 Workspace Context System

## Purpose

This document defines the workspace context abstraction introduced for NextShift OS 3.1.

This document implements the ARC-001 Platform Kernel rule: Member is the only authenticated identity, while Workspace, Role, Permission, and Workspace Membership carry business and access differences.

The context system lets shared modules behave differently for Retail Business OS and Recruitment Business OS through configuration instead of duplicated engines.

## Code Location

Workspace context code lives in:

- `src/modules/workspace/types.ts`
- `src/modules/workspace/workspace-config.ts`
- `src/modules/workspace/workspace-resolver.ts`
- `src/modules/workspace/workspace-switcher.ts`
- `src/modules/workspace/WorkspaceProvider.tsx`
- `src/modules/workspace/index.ts`

## Context Shape

`WorkspaceContext` provides:

- `activeWorkspaceId`
- `activeWorkspaceType`
- `activeMembership`
- `workspaceConfig`
- `enabledCapabilities`
- `navigationContext`
- `dashboardContext`
- `crmContext`
- `funnelContext`
- `contentContext`
- `analyticsContext`
- `aiContext`

## Resolver Flow

Resolver order:

1. Use active non-archived preferred workspace when supplied.
2. Use active default workspace when available.
3. Use first active workspace when available.
4. Fall back to a deterministic legacy default workspace.

This supports users who have no workspace records yet.

## Switcher Logic

`selectWorkspace` validates that the selected workspace:

- Exists in the supplied workspace list.
- Is active.
- Resolves through the same centralized context resolver.

The switcher does not render UI. It provides base logic for future UI components.

## Frontend Provider

`WorkspaceProvider` is a client-side provider/hook pair for future UI wiring:

- `WorkspaceProvider`
- `useWorkspaceContext`

The provider stores the active workspace context in React state and exposes `selectActiveWorkspace`.

No existing layout or navigation file was modified in this phase because the task scope is architecture landing and minimal skeleton only.

## Configuration Registry

`WORKSPACE_CONFIG_REGISTRY` maps workspace type to configuration.

Adding a new workspace type requires:

1. Add a new config entry.
2. Add the workspace type to seeded or persisted workspace data.
3. Avoid changing engine internals unless the engine needs a new generic capability field.

## Identity And Membership

ARC-001 removes Operator as an architecture identity.

Workspace access is represented by:

- `MemberId`
- `WorkspaceMembership`
- `WorkspaceRole`
- `WorkspacePermission`

Future permission checks should resolve through member workspace membership, not through business-specific identities such as Retail User or Recruitment User.

## Current Workspace Types

### Retail

Purpose:

Customer acquisition, customer lifecycle, sales, retention, repeat purchase, and referral.

Content track:

- `retail`

### Recruitment

Purpose:

Lead generation, appointments, presentations, activation, duplication, and leadership.

Content track:

- `recruitment`

## Engine Consumption Pattern

Shared engines receive optional workspace context.

Implemented signatures:

```ts
contentEngineService.generateCalendar(userId, days, track, workspaceContext);
contentEngineService.generatePlatformPost(userId, tenantId, platform, format, funnelStage, pillarName, workspaceContext);
crmCenterService.getCommandCenter(userId, tenantId, workspaceContext);
analyticsService.getAnalyticsCenter(userId, tenantId, workspaceContext);
getAICoachAdvice(missionId, workspaceContext);
getNextBestAction(missionId, completedTasks, workspaceContext);
```

These are backward-compatible because `workspaceContext` is optional.

## Module Context Responsibilities

### Navigation Context

Defines current primary workspace route and shared capability routes.

### Dashboard Context

Defines operational focus, metrics, and workspace language for dashboard surfaces.

### CRM Context

Defines lifecycle language and metric focus.

### Funnel Context

Defines offer/opportunity framing.

### Content Context

Defines content intent and track.

### Analytics Context

Defines metric grouping and interpretation.

### AI Context

Defines AI Coach / AI COO focus language.

## Backward Compatibility Behavior

Existing APIs and services continue working without passing workspace context.

If no workspace records exist, the resolver creates:

```text
tenant_id:legacy-default-workspace
```

with workspace type:

```text
retail
```

This preserves existing Retail-like Single Business Flow behavior.

## Test Coverage

Added:

- `src/__tests__/services/workspace-context.test.ts`

Covered:

- Legacy default workspace resolution
- Preferred workspace resolution
- Recruitment configuration resolution
- Workspace switching
- Inactive workspace rejection

## Future Integration Points

Next wiring phase:

- Load persisted workspaces from database.
- Add active workspace selection to authenticated layout.
- Pass `workspaceContext` through dashboard, CRM, content, funnel, analytics, and AI route services.
- Add `workspace_id` filtering only after non-destructive migrations are live.
