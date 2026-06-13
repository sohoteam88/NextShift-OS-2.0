# V3 Architecture Consistency Audit

Date: 2026-06-12 | 8 categories found

---

## 1. DATA STORAGE — CRITICAL

**Six modules store data in `user.metadata.*` JSON blobs** with no Prisma model:
`funnel_builder`, `traffic_engine`, `webinar`, `lead_magnet`, `social_setup`, `whatsapp_ai`

Each follows the same anti-pattern: read user → spread metadata → add key → write back. Opaque, non-queryable.

**Brand profile stored in TWO places:** `BrandInterview.extractedProfile` AND `user.metadata.brand_profile`.

**Funnel data stored in metadata AND Prisma Funnel table simultaneously.**

---

## 2. API ROUTES — CRITICAL

**4 wizard routes** bypass `apiHandler` wrapper → no centralized error handling.

**5 routes** use `getAuthUser()` instead of `requireAuthApi()` → manual copy-paste of status checks.

**Overlapping route groups:** `/api/v1/funnel/` + `/api/v1/funnel-builder/`, `/api/v1/video/` + `/api/v1/video-production/`, `/api/v1/crm/` + `/api/v1/crm-center/`, `/api/v1/analytics/` + `/api/v1/analytics-center/`, `/api/v1/admin/` + `/api/v1/admin-command/` + `/api/v1/platform-admin/`.

---

## 3. SERVICE SIGNATURES — HIGH

Three patterns coexist:
- `(userId: string)` — 7 services, NO tenant isolation
- `(userId: string, tenantId: string)` — 3 services, ad-hoc
- `(user: AuthUser)` — 20+ services, proper isolation

**Seven legacy services accept raw `userId`** with zero tenant protection.

**4 brand-builder services** define inline `AuthUser` type instead of importing canonical.

---

## 4. COMPONENT/HOOK PATTERNS — MEDIUM

React Query keys have no centralized convention: `['leads']`, `['lead', id]`, `['ai-content']`, `['brand-dna', 'health']` — all different patterns. No query key factory.

---

## 5. MISSION INTEGRATION — CRITICAL

**13 of 15 mission stages have NO completion trigger wired.** Only `first_content_generated` and `first_video_generated` trigger from their respective modules. The rest require manual `/api/v1/mission/complete-check` calls.

---

## 6. BRAND CONTEXT — HIGH

**6 service files bypass `getBrandContext()`** and read `brand_profile` from metadata directly. Even `getBrandContext()` itself reads from `user.metadata.brand_profile` — no true Prisma abstraction.

---

## 7. IMPORT PATHS — OK

All cross-module imports use `@/` alias consistently. No relative-path issues.

---

## 8. TYPE DUPLICATION — MEDIUM

**Duplicate `BrandDNA` interface** in `brand-dna/types.ts` (nested) and `brand-discovery/brandDnaGenerator.ts` (flat). Requires fragile manual mapping.

**Duplicate `AuthUser` type** defined inline in 4 brand-builder services.

---

## PRIORITY FIXES

| # | Issue | Impact | Effort |
|---|-------|--------|--------|
| 1 | Wire 13 remaining mission triggers | Functional: missions never auto-complete | Medium |
| 2 | Fix 4 wizard routes to use apiHandler + requireAuthApi | Security: missing auth validation | Low |
| 3 | Fix 5 routes using getAuthUser directly | Security: duplicate auth logic | Low |
| 4 | Add tenantId guard to 7 legacy services | Security: cross-tenant access | Medium |
| 5 | Remove duplicate brand profile storage | Data integrity | Medium |
| 6 | Consolidate BrandDNA type | Maintainability | Low |
| 7 | Fix 6 brand context bypasses | Maintainability | Medium |
| 8 | Consolidate overlapping API route groups | Clarity | High |
| 9 | Create query key factory | Maintainability | Low |
| 10 | Migrate metadata blobs to Prisma models | Data integrity | High |
