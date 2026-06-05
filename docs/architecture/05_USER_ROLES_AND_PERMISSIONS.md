# 05 — User Roles and Permissions

## Purpose

Define every role in the system, what each role can do, and how permissions are enforced.

## Scope

RBAC model. For database schema, see `07_DATABASE_ARCHITECTURE.md`. For API auth, see `08_API_ARCHITECTURE.md`.

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auth model | Role-Based Access Control (RBAC) | Simple, maps to real-world hierarchy |
| Permission granularity | Feature-level (not field-level) | Sufficient for MVP, less complexity |
| Role storage | `role` column on User table + Supabase RLS policies | Single source, enforced at DB level |
| Super admin | Platform Admin (Steven) has cross-tenant access | Required for platform operations |

## Role Hierarchy

```
Platform Admin (超级管理员)
    │
    ▼
Operator (运营者 / 领导) — owns a Tenant
    │
    ▼
Leader (团队领导) — manages a sub-team within Tenant
    │
    ▼
Member (成员 / 顾问) — individual user within Tenant
```

## Permission Matrix

| Feature | Platform Admin | Operator | Leader | Member |
|---------|:---:|:---:|:---:|:---:|
| **Tenant** |
| Create tenant | ✅ | ❌ | ❌ | ❌ |
| Edit tenant settings | ✅ | ✅ (own) | ❌ | ❌ |
| View all tenants | ✅ | ❌ | ❌ | ❌ |
| **Users** |
| Approve new members | ✅ | ✅ | ✅ (sub-team) | ❌ |
| Edit any user | ✅ | ✅ (own tenant) | ❌ | ❌ |
| Deactivate user | ✅ | ✅ (own tenant) | ❌ | ❌ |
| Change user role | ✅ | ✅ (own tenant) | ❌ | ❌ |
| **CRM** |
| View own leads | ✅ | ✅ | ✅ | ✅ |
| View team leads | ✅ | ✅ (all) | ✅ (sub-team) | ❌ |
| Create lead | ✅ | ✅ | ✅ | ✅ |
| Edit any lead | ✅ | ✅ (own tenant) | ✅ (sub-team) | ❌ (own only) |
| Delete lead | ✅ | ✅ | ❌ | ❌ |
| **Funnel** |
| Create funnel template | ✅ | ✅ | ❌ | ❌ |
| Create funnel from template | ✅ | ✅ | ✅ | ✅ |
| Publish funnel | ✅ | ✅ | ✅ | ✅ |
| **AI** |
| Use AI content generator | ✅ | ✅ | ✅ | ✅ |
| Manage AI prompt templates | ✅ | ✅ | ❌ | ❌ |
| **Automation** |
| Create WhatsApp sequence | ✅ | ✅ | ✅ | ❌ |
| Send individual message | ✅ | ✅ | ✅ | ✅ |
| **Admin** |
| Manage templates | ✅ | ✅ | ❌ | ❌ |
| View analytics | ✅ | ✅ (own tenant) | ✅ (sub-team) | ✅ (own only) |
| Manage CRM settings | ✅ | ✅ | ❌ | ❌ |
| **Team** |
| View full team tree | ✅ | ✅ | ✅ (sub-tree) | ❌ |
| View own downline | ✅ | ✅ | ✅ | ✅ |

## Data Flow

```
[Request] → [Auth Middleware: verify JWT] → [Tenant Middleware: resolve tenant_id]
    → [Permission Middleware: check role + resource] → [Route Handler]
```

## Main Components

### Middleware Stack
1. `authMiddleware` — validates JWT, attaches `user` to request
2. `tenantMiddleware` — resolves `tenant_id` from subdomain/header, validates user belongs to tenant
3. `permissionMiddleware(requiredRole)` — checks `user.role >= requiredRole`
4. `ownershipMiddleware(resourceType)` — for member-level: checks user owns the resource

### RLS Policies (Supabase)
- Every table has a `tenant_id` column
- RLS policy: `auth.uid()` must match a user in the same tenant
- Member-level: additional policy checking `owner_id = auth.uid()`

## Technical Considerations

- Role check happens at BOTH API middleware AND database RLS level (defense in depth)
- Leader's "sub-team" scope is determined by the sponsor tree (see `03_DOMAIN_MODEL.md`)
- Role upgrade (Member → Leader) requires Operator approval
- Platform Admin bypasses tenant scoping (uses service role key)

## Future Expansion

- Custom roles per tenant (Operator can define "Trainer", "Mentor" roles)
- Granular feature flags per plan tier
- API key based access for operator integrations

## Risks / Tradeoffs

| Risk | Mitigation |
|------|-----------|
| Role escalation bugs | RLS at DB level as safety net, not just middleware |
| Leader scope leaking to other sub-teams | Enforce sponsor tree path check, not just role check |
| Platform admin key compromise | Separate admin auth flow, audit log all admin actions |
