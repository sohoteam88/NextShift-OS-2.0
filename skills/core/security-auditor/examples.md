# Security Auditor Examples

## Example 1: New API Endpoint Audit

**Input:** "I just added `POST /api/v1/crm/leads/:id/export` that lets users export lead data as CSV. Review the security."

**Expected output:**
- Auth check: ✅ requires Bearer token
- Role check: ⚠️ endpoint allows `member` role but export should be `leader+` — potential data leak if member exports all leads
- Tenant isolation: ✅ filters by tenant_id
- Rate limiting: ❌ no rate limit — add 5 req/hour to prevent bulk scraping
- Audit logging: ❌ export not logged — add audit_log entry with user_id, lead_count, timestamp
- Input validation: ⚠️ no limit on export size — add max 1000 records per export
- Fix priority: High (role restriction + audit log)

## Example 2: RLS Policy Review

**Input:** "Check if our leads table RLS policy properly isolates tenants."

**Expected output:** SQL policy analysis, test queries that should succeed (same tenant) and fail (cross-tenant), integration test code snippet, pass/fail verdict.

## Example 3: PDPA Compliance Check

**Input:** "Are we PDPA compliant? We store name, email, phone, health goals in the leads table."

**Expected output:** Health goals = sensitive health data classification. Checklist: consent ✅/❌, purpose limitation ✅/❌, data access request ✅/❌, deletion mechanism ✅/❌, cross-border notice ✅/❌. Missing items with specific implementation steps.

## When NOT to Use This Skill

- User needs to **implement auth from scratch** → use `core/nextshift-os-architect`
- User needs **RBAC permission matrix design** → read `docs/architecture/05_USER_ROLES_AND_PERMISSIONS.md` first
- User needs **deployment/SSL setup** → use `core/deployment-engineer`
