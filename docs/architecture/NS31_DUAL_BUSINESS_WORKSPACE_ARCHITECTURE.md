# NS31 Dual Business Workspace Architecture

## Purpose

This document defines the NextShift OS 3.1 architecture landing for moving from a Single Business Flow architecture to a Dual Business Workspace Architecture.

This architecture is governed by `ARC-001_PLATFORM_KERNEL_MEMBER_CENTRIC_IDENTITY_FOUNDATION.md`.

The phase establishes architecture foundation and minimal code skeleton only. It does not redesign the UI, duplicate modules, duplicate pages, duplicate engines, or migrate existing data.

## Core Principle

One Platform. One AI Brain. One Business Memory. Multiple Business Workspaces. One Engine, Multiple Workspace Configurations.

The first workspace types are:

- Retail Business OS
- Recruitment Business OS

Future workspace types must be added through configuration or registry entries, not by cloning engines.

## Existing Repository Scan

### Funnel

Code:

- `src/modules/funnel/types.ts`
- `src/components/funnel-operating-system/*`
- `src/app/(auth)/funnel-builder/page.tsx`
- `src/app/(auth)/funnel/page.tsx`
- `src/app/api/v1/funnel-builder/*`

Docs:

- `docs/architecture/11_FUNNEL_ARCHITECTURE.md`
- `docs/architecture/ADR-003-funnel-domain.md`

Integration posture:

- Funnel is currently route/module based.
- Workspace integration should pass `WorkspaceContext` into generation and health services before route-level UI divergence.

### CRM

Code:

- `src/modules/crm/crmCenterService.ts`
- `src/modules/crm/crmEngines.ts`
- `src/modules/crm/types.ts`
- `src/app/(auth)/crm-center/page.tsx`
- `src/app/(auth)/crm/page.tsx`
- `src/app/(auth)/leads/page.tsx`
- `src/app/(auth)/customers/page.tsx`
- `packages/application/src/customer/*`
- `packages/application/src/lead/*`
- `packages/application/src/follow-up/*`
- `packages/domain/src/customer/*`
- `packages/domain/src/lead/*`

Docs:

- `docs/architecture/10_CRM_ARCHITECTURE.md`
- `docs/nextshift-os-3/capabilities/CAP-002_CRM_*.md`

Integration posture:

- `crmCenterService.getCommandCenter` now accepts optional workspace context.
- Full data filtering by `workspace_id` is deferred until the non-destructive database migration phase.

### Content

Code:

- `src/modules/content-engine/contentEngineService.ts`
- `src/modules/content-engine/contentGenerators.ts`
- `src/modules/content-engine/types.ts`
- `src/app/(auth)/content-engine/page.tsx`
- `packages/application/src/content*`
- `packages/domain/src/content*`

Docs:

- `docs/nextshift-os-3/capabilities/CAP-003_CONTENT_*.md`

Integration posture:

- `contentEngineService.generateCalendar` and `generatePlatformPost` now accept optional workspace context.
- Content track selection is config-driven through `WorkspaceConfig.contentTrack`.

### Dashboard

Code:

- `src/app/(auth)/dashboard/page.tsx`
- `src/app/(auth)/workspace/page.tsx`
- `src/__tests__/services/dashboard-projection-adapter.test.ts`

Docs:

- `docs/architecture/ADR-007-dashboard-philosophy.md`
- `docs/architecture/ADR-010-dashboard-mission-control.md`
- `audit/DASHBOARD_DEPENDENCY_AUDIT.md`

Integration posture:

- Dashboard context is provided by `WorkspaceContext.dashboardContext`.
- Dashboard UI should consume context before introducing workspace-specific layouts.

### AI Interview

Code:

- `src/__tests__/services/interview-authority-engine.test.ts`
- `src/app/(auth)/brand-discovery/page.tsx`
- `src/modules/brand-discovery/coachBrain.ts`

Docs:

- `audit/PHASE_8A_1_INTERVIEW_AUTHORITY_INVENTORY_REVIEW.md`
- `audit/TASK_001_INTERVIEW_AUTHORITY_SOURCE_AUDIT_REVIEW.md`

Integration posture:

- AI interview authority remains unchanged.
- Future prompts should include active workspace context without creating separate interview engines.

### Business Memory / Business Brain

Code:

- `packages/business-brain/src/*`
- `packages/domain/src/business-brain/*`
- `packages/application/src/business-brain/*`

Docs:

- `docs/nextshift-os-3/phase-2-architecture/BUSINESS_MEMORY_CONTRACT.md`
- `docs/nextshift-os-3/capabilities/cap-008-business-brain/*`

Integration posture:

- Business Brain remains shared.
- Workspace context should become part of memory retrieval and insight generation input, not a separate brain.

### Analytics

Code:

- `src/modules/analytics/analyticsService.ts`
- `src/modules/analytics/analyticsEngines.ts`
- `src/modules/analytics/types.ts`
- `packages/application/src/analytics/*`
- `packages/domain/src/analytics/*`

Docs:

- `docs/architecture/13_ANALYTICS_ARCHITECTURE.md`
- `docs/nextshift-os-3/capabilities/CAP-006_*`

Integration posture:

- `analyticsService.getAnalyticsCenter` now accepts optional workspace context.
- Workspace-specific filtering awaits `workspace_id` columns and indexes.

### AI Coach / AI COO

Code:

- `src/modules/ai-coach/ai-coach-service.ts`
- `src/__tests__/services/ai-coo-business-state-first.test.ts`
- `src/__tests__/services/ai-coo-decision-engine.test.ts`
- `docs/ai-coo/*`

Docs:

- `docs/architecture/ADR-008-ai-coach-system.md`
- `audit/COO-*.md`
- `audit/DASH-003_AI_COO_MISSION_ENGINE_PRD.md`

Integration posture:

- AI Coach advice functions now accept optional workspace context.
- AI COO remains shared and should receive context in future mission/recommendation execution calls.

### Tenant / User / Auth

Code:

- `src/modules/tenant/types.ts`
- `src/modules/auth/types.ts`
- `src/app/(auth)/layout.tsx`
- `src/app/api/auth/*`
- `prisma/schema.prisma` models `Tenant` and `User`
- Supabase auth integration through `@supabase/ssr` and `@supabase/supabase-js`

Docs:

- `docs/architecture/05_USER_ROLES_AND_PERMISSIONS.md`
- `docs/architecture/06_MULTI_TENANT_ARCHITECTURE.md`
- `docs/architecture/ADR-005-tenant-isolation.md`

Integration posture:

- Workspace belongs under tenant authority.
- Auth session stays user/tenant based; active workspace selection is application context, not authentication identity.

### Design System

Code:

- `packages/ui/src/*`
- `src/components/ui/*`
- `packages/shared/src/design-system/tokens/*`

Docs:

- `docs/nextshift-os-3/design-system/*`
- `audit/DS_001_DESIGN_TOKENS_AUDIT_REPORT.md` through `audit/DS_008_THEME_BRANDING_AUDIT_REPORT.md`

Integration posture:

- No Design System changes were made.
- Workspace switcher UI can later use existing Design System components.

### CAP-001 Through CAP-008

Docs:

- `docs/nextshift-os-3/capabilities/*`
- `docs/nextshift-os-3/capabilities/cap-008-business-brain/*`
- `audit/CAP_001_*` through `audit/CAP_008_*`

Integration posture:

- No CAP documents were modified.
- Workspace context is additive and backward-compatible.

## Workspace Domain Foundation

Implemented in:

- `src/modules/workspace/types.ts`
- `src/modules/workspace/workspace-config.ts`
- `src/modules/workspace/workspace-resolver.ts`
- `src/modules/workspace/workspace-switcher.ts`
- `src/modules/workspace/WorkspaceProvider.tsx`

Core concepts:

- `Workspace`
- `WorkspaceId`
- `WorkspaceType`
- `WorkspaceStatus`
- `WorkspaceConfig`
- `WorkspaceCapability`
- `WorkspaceContext`

## Workspace Configuration Model

Workspace behavior is driven by `WORKSPACE_CONFIG_REGISTRY`.

Retail configuration includes:

- Dashboard: customer pipeline, sales, retention, orders, repeat purchase, referral
- CRM: customer lifecycle
- Content: retail/customer acquisition
- Funnel: offer/customer journey
- Analytics: sales, retention, repeat purchase, referral
- AI Coach: sales, retention, customer health

Recruitment configuration includes:

- Dashboard: leads, appointments, presentations, activation, duplication, leadership
- CRM: prospect/business journey
- Content: authority, recruitment, opportunity education
- Funnel: opportunity/business presentation
- Analytics: appointments, activation, team growth, leadership
- AI Coach: recruitment, duplication, leadership

## Engine Integration Rule

Correct integration pattern:

```ts
engine.execute(input, workspaceContext);
```

Current skeleton integration points:

- `contentEngineService.generateCalendar(userId, days, track, workspaceContext)`
- `contentEngineService.generatePlatformPost(..., workspaceContext)`
- `crmCenterService.getCommandCenter(userId, tenantId, workspaceContext)`
- `analyticsService.getAnalyticsCenter(userId, tenantId, workspaceContext)`
- `getAICoachAdvice(missionId, workspaceContext)`
- `getNextBestAction(missionId, completedTasks, workspaceContext)`

Incorrect pattern:

```ts
retailContentEngine.execute();
recruitmentContentEngine.execute();
```

No cloned engines were created.

## Backward Compatibility

Legacy records without `workspace_id` remain valid.

The resolver creates a deterministic legacy default workspace when no workspace records exist:

```text
{tenantId}:legacy-default-workspace
```

This preserves current Single Business Flow behavior while allowing future workspace-aware APIs to resolve a context.

## Architecture Decision

Workspace context is application context, not authentication context.

Auth identifies the Member and tenant. Workspace context identifies which business operating mode controls copy, prioritization, navigation, dashboard focus, CRM lifecycle, funnel framing, content track, analytics focus, and AI coaching focus.

ARC-001 supersedes older architecture documents that used Operator as an authenticated identity. In 3.1 architecture, Operator is not a separate identity; business differences belong to Workspace, permission differences belong to Role, and access differences belong to Workspace Membership.

## Non-Goals

- No duplicated pages
- No duplicated engines
- No runtime route split
- No destructive database migration
- No Design System redesign
- No CAP-001 through CAP-008 rewrites

## Next Architecture Step

Add a non-destructive workspace table migration and API resolver after audit approval.
