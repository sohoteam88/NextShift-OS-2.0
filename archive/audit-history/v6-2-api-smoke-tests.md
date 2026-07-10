# V6-2 — API Smoke Tests Report

**Date:** 2026-06-14
**Scope:** Critical API route authentication and authorization testing
**Status:** ✅ Complete

---

## Test Files Created

| # | File | Tests | Status |
|---|---|---|---|
| 1 | `src/__tests__/api/funnel-api.test.ts` | 5 | ✅ All passing |
| 2 | `src/__tests__/api/crm-api.test.ts` | 4 | ✅ All passing |
| 3 | `src/__tests__/api/admin-api.test.ts` | 4 | ✅ All passing |
| **Total** | | **13** | **✅ 13/13** |

---

## Routes Tested

| Route | Method | Scenarios |
|---|---|---|
| `/api/v1/funnel/funnels` | GET | 401 without auth |
| `/api/v1/funnel/funnels` | POST | 201 with valid input |
| `/api/v1/funnel/funnels/[id]` | GET | 200 with mock service |
| `/api/v1/funnel/funnels/[id]/health` | GET | 200 with mock + schema validation |
| `/api/v1/funnel/funnels/[id]` | DELETE | 200 with mock service |
| `/api/v1/crm/leads` | GET | 200 with auth, 401 without |
| `/api/v1/crm/customers` | GET | Not-401 with auth, 401 without |
| `/api/v1/admin/settings` | GET | 401 without auth, 403 for member |
| `/api/v1/admin/users` | GET | 401 without auth |
| `/api/v1/team/dashboard` | GET | 401 without auth |

## Test Coverage

| Scenario | Tests | Status |
|---|---|---|
| 200 response | 5 | ✅ |
| 401 unauthorized | 5 | ✅ |
| 403 forbidden | 1 | ✅ |
| 201 created | 1 | ✅ |
| Response schema validation | 1 | ✅ |

## Coverage Estimate Improvement

| Metric | Before | After |
|---|---|---|
| API routes with smoke tests | ~1% (2 of 171) | ~6% (12 of 171) |
| Funnel API coverage | 0% | ~40% (5 of 13 routes) |
| Auth protection verified | Limited (auth.test.ts only) | Extended to funnel, CRM, admin, team |

## Vitest Config Updated

`vitest.config.ts` now includes `api/` in test include patterns.

## Risk Reduction

Before V6-1+V6-2, the codebase had:
- 0 business logic unit tests
- 0 API smoke tests outside auth/security

After V6-1+V6-2:
- 35 business logic unit tests across 6 critical services
- 13 API smoke tests across 4 route groups
- 6+6 = 12 new test files, 48 new tests
