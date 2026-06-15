# ADR-005: Tenant Isolation

**Status:** Accepted
**Date:** 2026-06-15
**Deciders:** Security audit (V6-4), database audit (V6-9)

## Context

NextShift OS is a multi-tenant SaaS platform. Every tenant's data must be isolated from every other tenant. Cross-tenant data leaks are the highest-severity security risk.

## Decision

### Three-Layer Isolation

| Layer | Mechanism | Coverage |
|---|---|---|
| **Application** | `tenantId` filter on all Prisma queries | 30 of 31 tables |
| **Database** | Supabase Row-Level Security (RLS) | 45 policies |
| **API** | `requireAuthApi()` middleware | 171 API routes |

### Application Layer

Every service function that queries the database includes a `tenantId` filter:

```typescript
// All queries follow this pattern
const where: Prisma.FunnelWhereInput = { tenantId: user.tenantId };
if (user.role === 'member') where.ownerId = user.id; // + owner scoping
```

The `Tag` model is the only exception — tags are shared across tenants by design (shared taxonomy).

### Database Layer

RLS policies enforce tenant access at the PostgreSQL level. Even if application code is bypassed, the database rejects cross-tenant queries:

```sql
CREATE POLICY "Users can view their tenant data" ON funnel
  FOR SELECT USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));
```

### API Layer

- 171 API routes protected by `requireAuthApi()`
- Admin routes additionally protected by `requireRoleApi()`
- Exception: health endpoint, payment webhooks, public funnel endpoints (legitimate no-auth)

### JSONB Isolation

`User.metadata` stores unstructured data (agent memory). If two tenants share a user (e.g., admin user), data could theoretically leak. Mitigation: user accounts are tenant-scoped — shared users don't exist.

### Timestamp Standardization

All 31 database models have `createdAt` and `updatedAt` (V6-10). Append-only tables (`AIUsageLog`, `AuditLog`, `AnalyticsEvent`) are exempt from `updatedAt`.

## Consequences

- ✅ Tenant isolation score: 98/100
- ✅ Zero known cross-tenant data leaks
- ✅ RLS provides defense-in-depth
- ⚠️ In-memory rate limiter doesn't work across instances (needs Redis before production)
- ⚠️ `Tag` model is intentionally shared — documented exception

## Related

- V6-4 (Security Audit)
- V6-9 (Database Architecture Audit)
- V6-10 (Timestamp Normalization)
- V6-11 (Funnel Config Size Monitor)
