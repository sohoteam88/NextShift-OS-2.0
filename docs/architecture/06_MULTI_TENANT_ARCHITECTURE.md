# 06 — Multi-Tenant Architecture

## Purpose

Define how tenant isolation works — data boundaries, URL routing, resource limits.

## Scope

Tenant lifecycle and isolation. For roles, see `05_USER_ROLES_AND_PERMISSIONS.md`. For DB, see `07_DATABASE_ARCHITECTURE.md`.

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Isolation model | Shared database, shared schema, tenant_id column | Cost-effective, simple, sufficient for <1000 tenants |
| Tenant identification | Subdomain (`sarah.nextshift.app`) OR header-based | Subdomain is user-friendly, header fallback for API clients |
| Public funnels | Custom slug under shared domain (`nextshift.app/f/{slug}`) | No DNS setup needed per member |
| Resource quotas | Plan-based limits stored in tenant settings | Enforce member count, AI calls, storage per plan |

## Tenant Lifecycle

```
1. Platform Admin creates Tenant → assigns Operator
2. Operator configures settings (branding, pipeline, tags)
3. Operator invites Members (or Members self-register with approval)
4. All data created within tenant is scoped to tenant_id
5. Tenant can be suspended (no access) or archived (read-only)
```

## Data Flow

```
[Browser: sarah.nextshift.app]
    → [Next.js Middleware: extract subdomain "sarah"]
    → [Resolve tenant_id from slug "sarah"]
    → [Attach tenant_id to request context]
    → [All DB queries include WHERE tenant_id = ?]
    → [RLS policy enforces tenant_id match]
```

## Main Components

### Tenant Resolution Middleware
```typescript
// Pseudocode
function resolveTenant(req) {
  const subdomain = extractSubdomain(req.headers.host)
  // OR
  const tenantSlug = req.headers['x-tenant-slug']
  
  const tenant = await db.tenant.findUnique({ where: { slug } })
  if (!tenant || tenant.status !== 'active') throw 403
  
  req.tenant = tenant
}
```

### Tenant Settings Schema
```json
{
  "branding": { "logo_url": "", "primary_color": "#..." },
  "pipeline_stages": ["New", "Contacted", "Interested", "Closing", "Won", "Lost"],
  "tag_presets": ["Health", "Weight Loss", "Energy", "Skin"],
  "member_limit": 100,
  "ai_monthly_quota": 500,
  "storage_limit_mb": 5000,
  "default_language": "zh"
}
```

### Plan Tiers

| Feature | Starter | Growth | Pro |
|---------|---------|--------|-----|
| Members | 20 | 100 | 500 |
| AI calls/month | 200 | 1000 | 5000 |
| Funnels | 5 | 20 | Unlimited |
| Storage | 1 GB | 5 GB | 20 GB |
| WhatsApp sequences | 3 | 10 | Unlimited |
| Custom branding | ❌ | ✅ | ✅ |

## Technical Considerations

- **Every** database query must include `tenant_id` — enforced by Prisma middleware and RLS
- Tenant settings are cached in memory (invalidated on update via Supabase realtime)
- Public funnel pages are statically generated where possible, tenant-aware at build time
- File uploads are stored under `{tenant_id}/` prefix in Supabase Storage

## Future Expansion

- Custom domain per tenant (CNAME to `nextshift.app`)
- White-label branding (remove NextShift branding entirely)
- Tenant-to-tenant template marketplace
- Per-tenant billing via Stripe

## Risks / Tradeoffs

| Risk | Mitigation |
|------|-----------|
| Tenant data leak (cross-tenant query) | RLS + middleware + automated tests for tenant isolation |
| Noisy neighbor (one tenant's AI calls slow others) | Per-tenant rate limiting, queue-based AI processing |
| Tenant deletion data cleanup | Soft delete first, hard delete via background job after 90 days |
