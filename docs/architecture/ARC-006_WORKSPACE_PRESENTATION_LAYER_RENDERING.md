# ARC-006 Workspace Presentation Layer Rendering

Version: 1.0

Status: Released — Workspace Presentation Layer Rendering

Architecture Track: NextShift OS 3.1

Depends On: ARC-001, ARC-002, ARC-003, ARC-004, ARC-005

## Purpose

ARC-006 turns the completed Dual Business Workspace Architecture into an end-to-end runtime UI experience.

ARC-004 configured the Retail Business OS through Workspace Manifest metadata. ARC-005 configured the Recruitment Business OS through the same Workspace Manifest pattern.

Both audits identified the same non-blocking follow-up: presentation-layer wiring is still required so shared UI surfaces consume Workspace Registry metadata.

ARC-006 addresses that gap.

## Mission

Enable Retail Business OS and Recruitment Business OS to render distinct business experiences from Workspace Registry metadata without duplicating pages, modules, engines, or Design System components.

The user should feel like they are using different Business Operating Systems.

The engineering team must still maintain one shared application shell.

## Core Principle

```text
Workspace Manifest
    ↓
Workspace Registry
    ↓
Workspace Context
    ↓
Shared Presentation Renderers
    ↓
Business OS Experience
```

No Retail-specific or Recruitment-specific page clones are allowed.

## Objectives

ARC-006 must:

- Render navigation from Workspace Registry metadata.
- Render dashboard widgets from Workspace Registry metadata.
- Render templates from Workspace Registry metadata.
- Render AI Coach / AI COO profile metadata where applicable.
- Render business capabilities from Workspace Registry metadata.
- Preserve shared routes, shared engines, shared components, and shared Design System.
- Preserve backward compatibility for legacy UI flows.

## Presentation Layer Scope

ARC-006 applies to shared UI surfaces such as:

- Sidebar / Navigation
- Dashboard
- Workspace Selector
- Templates / Content creation entry points
- Funnel / Landing template selectors
- AI Coach context panels
- AI COO context panels
- Business capability surfaces

Do not redesign the whole UI.

Do not create separate Retail or Recruitment apps.

## Required Architecture

### Navigation Rendering

Navigation should be resolved from:

```text
WorkspaceContext
  ↓
WorkspaceRegistry.getNavigationItems()
  ↓
Shared Navigation Renderer
```

Retail and Recruitment navigation must differ through metadata only.

### Dashboard Rendering

Dashboard should be resolved from:

```text
WorkspaceContext
  ↓
WorkspaceRegistry.getDashboardWidgets()
  ↓
Shared Dashboard Renderer
```

Widgets may render existing shared components.

Do not create RetailDashboard or RecruitmentDashboard engines.

### Template Rendering

Template selectors should resolve from:

```text
WorkspaceContext
  ↓
WorkspaceRegistry.getTemplates()
  ↓
Shared Template Selector
```

Templates may differ by workspace.

Template rendering must remain configuration-driven.

### AI Profile Rendering

AI Coach and AI COO surfaces should resolve from:

```text
WorkspaceContext
  ↓
WorkspaceRegistry.getAIProfile()
  ↓
WorkspaceRegistry.getAICOOProfile()
```

This can be used for labels, focus areas, prompts, recommendations, helper copy, or context panels.

Do not create separate AI Coach engines.

### Business Capability Rendering

Capability surfaces should resolve from:

```text
WorkspaceContext
  ↓
WorkspaceRegistry.getBusinessCapabilities()
```

Capabilities can drive visible cards, dashboard shortcuts, empty states, onboarding tasks, or feature groups.

## Backward Compatibility

If no workspace context is resolved:

- Use default legacy workspace.
- Preserve existing route behavior.
- Preserve existing UI fallback.
- Do not break released CAP-001 through CAP-008 surfaces.

## Required Deliverables

Codex must produce:

- Shared Navigation Renderer integration
- Shared Dashboard Widget rendering integration
- Shared Template Selector integration where safe
- AI Profile display integration where safe
- Capability metadata display integration where safe
- Tests for Retail and Recruitment rendering differences
- Documentation updates
- Implementation report

## Exit Criteria

ARC-006 may proceed to Verification only when:

- Retail and Recruitment presentation metadata can be consumed by shared UI renderers.
- No duplicated pages, modules, or engines are introduced.
- Existing routes continue to work.
- Shared Design System remains intact.
- Workspace fallback remains functional.
- Tests and validation are recorded.

## Next Phase

After ARC-006 release, proceed to one of:

1. Operator-to-Member RBAC Migration
2. businessMode Consolidation
3. Workspace Persistence Migration
4. Production Readiness Review for Dual Business OS

The recommended next phase is:

**Operator-to-Member RBAC Migration**
