# NS31 Migration Plan

## Purpose

This document defines the migration sequence from Single Business Flow to Dual Business Workspace Architecture.

The migration is incremental and non-destructive.

## Migration Principles

- Do not duplicate modules.
- Do not duplicate pages.
- Do not duplicate engines.
- Do not introduce Operator as a platform identity.
- Model authenticated users as Members.
- Model access through Workspace Membership, Role, and Permission.
- Do not hide legacy records.
- Keep tenant isolation unchanged.
- Introduce workspace awareness through resolver, configuration, and optional context first.
- Add database constraints only after backfill and audit.

## Phase 0: Architecture Landing

Status:

- Implemented in this phase.

Deliverables:

- Workspace context types and config registry.
- Workspace resolver.
- Workspace switcher base logic.
- Frontend provider/hook.
- Optional workspace context parameters on Content, CRM, Analytics, and AI Coach entry points.
- Architecture and database evolution docs.

Acceptance:

- Existing Single Business Flow works without workspace records.
- `pnpm type-check` passes.
- Unit tests cover resolver/switcher behavior.

## Phase 1: Persist Workspaces

Goal:

Create a database-backed workspace table without touching existing business records.

Tasks:

1. Add `workspaces` table.
2. Add default retail workspace for each tenant.
3. Add workspace resolver repository.
4. Add server API/service to fetch workspaces for authenticated tenant.
5. Keep fallback resolver for tenants missing workspace rows.

Acceptance:

- Every tenant has one default active workspace.
- Existing pages still load.
- No business record filtering changes yet.

## Phase 2: Workspace Selection UI

Goal:

Expose workspace selection without duplicating routes.

Tasks:

1. Add selector UI using existing Design System components.
2. Persist selected workspace per user in user metadata or a dedicated preference table.
3. Hydrate `WorkspaceProvider` in authenticated layout.
4. Confirm navigation stays shared.

Acceptance:

- User can switch active workspace.
- Active context changes labels/focus where context is wired.
- No duplicated dashboard/sidebar/page files.

## Phase 3: Add Nullable Workspace IDs

Goal:

Add nullable workspace references to business records.

Priority tables:

- `leads`
- `customers`
- `funnels`
- `contents`
- `content_calendars`
- `analytics_events`

Tasks:

1. Add nullable `workspace_id` columns.
2. Add `tenant_id, workspace_id` indexes.
3. Keep reads compatible with null workspace IDs.
4. Start writing workspace ID for new records when active context exists.

Acceptance:

- Legacy records remain visible.
- New records can be associated with active workspace.
- No not-null constraints yet.

## Phase 4: Backfill Existing Records

Goal:

Move legacy records into default workspace safely.

Tasks:

1. Backfill by tenant default workspace.
2. Run row counts before and after.
3. Validate no cross-tenant workspace assignments.
4. Produce audit report.

Acceptance:

- Backfilled record count matches expected legacy rows.
- Records remain visible in existing APIs.
- No tenant isolation regression.

## Phase 5: Workspace-Aware Filtering

Goal:

Make modules workspace-aware.

Tasks:

1. Add workspace filters to CRM queries.
2. Add workspace filters to content queries.
3. Add workspace filters to funnel queries.
4. Add workspace filters to analytics projections.
5. Add workspace context to AI Coach and AI COO decision inputs.
6. Add permission resolver checks through workspace membership.

Acceptance:

- Retail and recruitment contexts return independent business views.
- Engines remain shared.
- APIs remain backward compatible during transition.

## Phase 6: Tighten Constraints

Goal:

Finish migration once compatibility is proven.

Tasks:

1. Require workspace ID for new writes.
2. Consider not-null constraints on priority tables.
3. Add workspace membership model if role separation requires it.
4. Add RLS policies for workspace membership if exposed client access requires it.

Acceptance:

- All workspace-owned records have workspace ID.
- RLS and API authorization pass audit.
- Legacy null handling can be retired deliberately.

## Rollback Strategy

Architecture/code rollback:

- Stop passing workspace context.
- Keep default resolver behavior.

Database rollback:

- Do not drop columns immediately.
- Disable workspace filtering in application layer.
- Retain nullable `workspace_id` until data is audited.

## CAP Regression Protection

Before each migration phase:

- Review CAP-001 through CAP-008 affected flows.
- Confirm no capability document is rewritten unless the phase explicitly requires it.
- Run typecheck, lint, tests, and build.

## Next Recommended Task

Create and review the `workspaces` table migration only, then add a server-side workspace repository that feeds the existing `WorkspaceProvider`.
