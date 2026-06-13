# Domain Boundary Report — NextShift OS V3

Date: 2026-06-12

## Domain Ownership Map

| Domain | Module Path | Owns | Depends On | API Routes |
|--------|------------|------|------------|------------|
| Mission Engine | `src/modules/mission/` + `mission-engine/` | UserProgress, Mission, Achievement, Journey Map | Auth | `/api/v1/mission/*`, `/api/mission/*` |
| Brand Discovery | `src/modules/brand-discovery/` | BrandInterview, Slot Extraction, Coach Brain, Confidence | BrandContextProvider, Mission Engine, AI Router | `/api/v1/brand-builder/interview/*` |
| Brand DNA | `src/modules/brand-dna/` | BrandProfile table, BrandContextProvider | Brand Discovery (extracted profiles) | `/api/v1/brand-dna/*` |
| Social Setup | `src/modules/social-setup/` | FB/IG/BIO/Visual generation | BrandContextProvider | `/api/v1/social-setup/*` |
| Content Engine | `src/modules/content-engine/` | Content, ContentCalendar, Post generation | BrandContextProvider | `/api/v1/content-engine/*` |
| Video Production | `src/modules/video-production/` | VideoProject, Script, ShotList, AI Prompts | BrandContextProvider | `/api/v1/video-production/*` |
| Lead Magnet | `src/modules/lead-magnet/` | Assessment, Quiz, Checklist, Lead Segmentation | BrandContextProvider | `/api/v1/lead-magnet/*` |
| Webinar Center | `src/modules/webinar-center/` | Webinar strategy, Loom script, Follow-up sequence | BrandContextProvider | `/api/v1/webinar-center/*` |
| Funnel Builder | `src/modules/funnel-builder/` | Landing Page, Thank You, Email Sequence, Ad Angles | BrandContextProvider, Funnel (Prisma) | `/api/v1/funnel-builder/*` |
| Traffic Engine | `src/modules/traffic-engine/` | Campaign planning, Budget planner, Ad platforms | BrandContextProvider, Funnel Builder | `/api/v1/traffic-engine/*` |
| WhatsApp AI | `src/modules/whatsapp-ai/` | Smart Reply, Lead Scoring, Follow-up, Objection handling | BrandContextProvider, CRM (Prisma) | `/api/v1/whatsapp-ai/*` |
| CRM | `src/modules/crm/` + existing CRM | Revenue Command Center, Lead pipeline, Opportunities | BrandContextProvider | `/api/v1/crm-center`, `/api/v1/crm/*` |
| Analytics | `src/modules/analytics/` | Business Health Score, AI Insights, KPIs | All modules (read-only aggregation) | `/api/v1/analytics-center` |
| Admin | `src/modules/admin/` | User approval, Tenant health, AI usage, Broadcasts | All modules | `/api/v1/admin-command`, `/api/v1/admin/*` |
| SaaS | `src/modules/saas/` | Plans, Feature gates, Usage limits, AI credits | BrandContextProvider, Tenant | `/api/v1/saas` |

## Dependency Hierarchy

```
Mission Engine (foundation — no module deps)
    ↓
Brand Discovery → Brand DNA (BrandContextProvider)
    ↓
Social Setup → Content Engine → Video Production
    ↓
Lead Magnet → Webinar Center
    ↓
Funnel Builder 2.0 → Traffic Engine
    ↓
WhatsApp AI → CRM
    ↓
Analytics (reads all)
    ↓
Admin (manages all) → SaaS (monetizes all)
```

## Cross-Domain Violations

| Violation | Severity | Fix |
|-----------|----------|-----|
| 4 wizard routes bypass `apiHandler` | HIGH | ✅ Fixed |
| 5 routes use `getAuthUser()` instead of `requireAuthApi()` | HIGH | ✅ Fixed |
| 6 services bypass `getBrandContext()` | HIGH | ✅ Fixed |
| 30+ files read `brand_profile` directly from metadata | MEDIUM | Service layer fixed; UI layer contained |
| Overlapping route groups (`/funnel` + `/funnel-builder`) | MEDIUM | Documented, old routes kept for compat |
| Query keys scattered across components | LOW | ✅ `queryKeys` factory created |

## Recommendations

1. **Canonical routes**: Pick one URL per domain (e.g., `/api/v1/funnel-builder`), keep old routes with deprecation headers
2. **No new metadata stores**: All new data goes into Prisma models
3. **All services use `(user: AuthUser)`**: Enforce tenant isolation at compile time
4. **New modules**: Must read from `getBrandContext()`, must use `queryKeys.x()` factory, must wire mission triggers
