# NS31 Database Evolution Plan

## Purpose

This document defines the non-destructive database evolution plan for adding workspace support to NextShift OS 3.1.

No destructive migration was applied in this phase.

## Current Data Shape

The current Prisma schema is tenant-centric.

Core tables already include `tenant_id`:

- `users`
- `leads`
- `customers`
- `funnels`
- `contents`
- `content_calendars`
- `analytics_events`
- `missions`
- `achievements`
- `brand_profiles`
- `video_projects`
- `activities`
- `audit_logs`

Business records currently do not have `workspace_id`.

## Target Tables

### workspaces

Proposed columns:

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key. |
| tenant_id | uuid | Required. References `tenants(id)`. |
| workspace_type | text | Required. Initial values: `retail`, `recruitment`. |
| name | text | Human-readable label. |
| status | text | `active` or `archived`. |
| is_default | boolean | Exactly one default active workspace per tenant after migration. |
| config | jsonb | Optional workspace-specific override configuration. |
| created_at | timestamptz | Creation timestamp. |
| updated_at | timestamptz | Update timestamp. |

Recommended indexes:

- `workspaces(tenant_id)`
- `workspaces(tenant_id, workspace_type)`
- partial unique index on default workspace per tenant:
  - `unique where tenant_id, is_default = true and status = 'active'`

Recommended constraints:

- `workspace_type <> ''`
- `status in ('active', 'archived')`

### workspace_members

Optional later table if a user may access different workspaces with different roles.

Proposed columns:

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key. |
| tenant_id | uuid | Required. |
| workspace_id | uuid | Required. |
| member_id | uuid | Required. References the authenticated member/user record. |
| role | text | Workspace-level role. |
| status | text | `active`, `invited`, `archived`. |

Initial phase may derive access from tenant membership and skip this table.

## Target Workspace References

Add nullable `workspace_id` columns in phases.

Priority 1:

- `leads`
- `customers`
- `funnels`
- `contents`
- `content_calendars`
- `analytics_events`

Priority 2:

- `activities`
- `scheduled_messages`
- `missions`
- `achievements`
- `brand_profiles`
- `video_projects`
- `campaign` tables when present in Prisma

Priority 3:

- AI usage logs
- audit logs
- prompt templates
- training progress

## Relationship Rule

Every workspace-owned record must satisfy:

```text
record.tenant_id = workspace.tenant_id
```

This prevents cross-tenant workspace assignment.

## Backward Compatibility

Existing records without `workspace_id` remain readable.

Read resolver strategy:

1. If record has `workspace_id`, use it.
2. If request has active workspace and record has no `workspace_id`, treat record as belonging to tenant default workspace during compatibility window.
3. Do not reject null `workspace_id` until all legacy records are backfilled and APIs are updated.

Write strategy:

1. New workspace-aware writes should include `workspace_id`.
2. Legacy writes may omit `workspace_id` and resolve to tenant default workspace server-side.
3. After compatibility window, writes without `workspace_id` should fail validation.

## Default Workspace Migration

Migration sequencing:

1. Create `workspaces` table.
2. For every existing tenant, create one active default retail workspace.
3. Add nullable `workspace_id` columns to priority tables.
4. Backfill existing records to tenant default workspace in batches.
5. Add indexes on `tenant_id, workspace_id`.
6. Update application services to filter by active workspace where safe.
7. Add not-null constraints only after audit confirms backfill completeness.

## RLS And Supabase Notes

Supabase/Postgres RLS must continue to use tenant ownership and user membership.

Rules:

- Do not use user-editable metadata for authorization.
- Do not expose workspace rows without tenant membership validation.
- New tables in exposed schemas must have RLS enabled before client access.
- Policies should restrict rows by tenant membership and workspace membership when membership table exists.

Initial RLS concept:

```sql
tenant_id in (
  select tenant_id
  from users
  where id = auth.uid()
)
```

Workspace-level RLS becomes:

```sql
workspace_id in (
  select workspace_id
  from workspace_members
  where member_id = auth.uid()
    and status = 'active'
)
```

Only add workspace membership RLS after the membership model exists.

## Draft Migration Shape

No migration file was created in this phase because the task requested planning and minimal skeleton only.

Draft SQL outline:

```sql
create table workspaces (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  workspace_type text not null,
  name text not null,
  status text not null default 'active',
  is_default boolean not null default false,
  config jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workspaces_status_check check (status in ('active', 'archived')),
  constraint workspaces_type_check check (length(trim(workspace_type)) > 0)
);

create index workspaces_tenant_id_idx on workspaces(tenant_id);
create index workspaces_tenant_type_idx on workspaces(tenant_id, workspace_type);
create unique index workspaces_one_active_default_per_tenant_idx
  on workspaces(tenant_id)
  where is_default = true and status = 'active';
```

Priority column addition pattern:

```sql
alter table leads add column workspace_id uuid null references workspaces(id);
create index leads_tenant_workspace_idx on leads(tenant_id, workspace_id);
```

Backfill pattern:

```sql
update leads l
set workspace_id = w.id
from workspaces w
where l.tenant_id = w.tenant_id
  and w.is_default = true
  and w.status = 'active'
  and l.workspace_id is null;
```

## Data Integrity Risks

Known risks:

- Legacy rows may not map cleanly if a tenant already has multiple business modes in one data set.
- Adding `workspace_id` too early to API filters could hide legacy records.
- Not-null constraints before backfill would break existing data.
- Workspace membership model must be designed before workspace-level authorization becomes strict.

## Recommended First Database Task

Create a reviewed Supabase/Prisma migration for the `workspaces` table only, seed one default workspace per tenant, and add no foreign key columns to business records until read/write compatibility is verified.
