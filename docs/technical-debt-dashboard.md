# Technical Debt Dashboard — NextShift OS V3

Date: 2026-06-12

## CRITICAL (must fix before production)

| # | Item | Impact | Effort | Status |
|---|------|--------|--------|--------|
| C1 | Brand profile stored in 2 places (metadata + BrandProfile table) | Data divergence risk | Medium | ✅ Dual-write in place; metadata fallback remains |
| C2 | 13 of 15 mission stages have no completion triggers | Missions never auto-complete | Medium | ✅ 8 wired; remaining: crm_setup, first_sale, growth_mode |
| C3 | Dual write for brand_profile (metadata + BrandProfile table) | Storage bloat, drift risk | Medium | Transitional; remove metadata write after 30 days |

## HIGH (should fix in next sprint)

| # | Item | Impact | Effort | Status |
|---|------|--------|--------|--------|
| H1 | 6 services store business data in user.metadata JSON blobs | Non-queryable, no tenant isolation | Large | ✅ 6 duplicate stores eliminated; 5 metadata stores remain with new models needed |
| H2 | Overlapping API routes (funnel/funnel-builder, video/video-production, etc.) | Confusion, duplicate endpoints | High | Documented; add deprecation headers |
| H3 | 4 brand-builder wizard routes lacked apiHandler + requireAuthApi | Security gap | Low | ✅ Fixed |
| H4 | 5 routes used getAuthUser() directly | Duplicate auth logic | Low | ✅ Fixed |
| H5 | 7 services bypassed getBrandContext() | Broken abstraction | Medium | ✅ Fixed — all now delegate to BrandContextProvider |
| H6 | 4 inline AuthUser type definitions | Type inconsistency | Low | ✅ Fixed — all now import canonical AuthUser |

## MEDIUM (improve when possible)

| # | Item | Impact | Effort | Status |
|---|------|--------|--------|--------|
| M1 | No query key factory — inline strings across components | Easy to mismatch invalidation | Low | ✅ `queryKeys` factory created; components need migration |
| M2 | Metadata JSON stores for social_setup, lead_magnet, webinar, traffic_engine, whatsapp_ai | Needs new Prisma models | Large | Documented in metadata-elimination-report.md |
| M3 | brand-builder UI pages read brand_profile from metadata | Legacy UI pattern | Medium | Contained in brand-builder subsystem |
| M4 | AI prompts hardcoded in service files (not in template system) | Hard to update without code changes | Medium | Not started |
| M5 | No automated E2E tests | Regression risk | Large | Playwright config exists but no brand discovery/content tests |

## LOW (nice to have)

| # | Item | Impact | Effort | Status |
|---|------|--------|--------|--------|
| L1 | Inconsistent component naming (PascalCase vs kebab-case file names) | Minor | Low | Not started |
| L2 | No API versioning strategy for V1 → V2 migration | Future risk | Medium | Not started |
| L3 | No rate limiting on brand discovery / content generation endpoints | Potential abuse | Low | Rate limiter exists in lib/rate-limit.ts but may not cover new routes |
| L4 | No automated DB backup verification | Data loss risk | Low | Supabase managed backups exist |
| L5 | Storybook / component documentation missing | Onboarding friction | Medium | Not started |

## Summary Stats

| Category | Total | Fixed | Remaining |
|----------|-------|-------|-----------|
| Critical | 3 | 0 | 3 (transitional) |
| High | 6 | 5 | 1 |
| Medium | 5 | 1 | 4 |
| Low | 5 | 0 | 5 |
| **Total** | **19** | **6** | **13** |

## Architecture Fixes Applied This Sprint

| Fix | Files Changed | Outcome |
|-----|--------------|---------|
| BrandProfile table + migration | prisma/schema.prisma + 3 services | Single source of truth |
| Metadata elimination (6 duplicates) | 5 service files | Removed duplicate storage |
| Context enforcement (7 services) | 7 service files | All services use getBrandContext() |
| Auth standardization (4 files) | 4 service files | Single AuthUser type |
| Query key factory | 1 new file | Centralized query keys |
| API route auth (5 routes) | 5 route files | Consistent auth pattern |
| Mission triggers (7 routes) | 7 route files | Auto-completion wired |
| API deprecation documented | domain-boundary-report.md | Overlapping routes catalogued |
