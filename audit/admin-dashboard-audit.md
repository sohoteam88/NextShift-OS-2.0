# Admin Dashboard Decomposition Audit — V6-6

**Date:** 2026-06-14  
**Scope:** `src/app/(auth)/admin`, `src/modules/admin`  
**Status:** Audit complete — no code changes

---

## 1. Current File Sizes

### Admin Page Files (`app/(auth)/admin/`)

| File | Lines | Status |
|---|---|---|
| `plan/page.tsx` | 168 | 🟡 Above target |
| `approvals/page.tsx` | 29 | ✅ |
| All others (13 files) | 9–16 | ✅ |

**Verdict:** Pages are well-decomposed. Only `plan/page.tsx` at 168 lines needs attention.

### Admin Module Services (`modules/admin/services/`)

| File | Lines | Status |
|---|---|---|
| `platform-admin-service.ts` | **599** | 🔴 Critical |
| `admin-service.ts` | **486** | 🔴 Critical |
| `platformOperatingService.ts` | **377** | 🔴 Critical |
| `workspaceHealthService.ts` | 315 | 🟠 High |
| `beta-command-service.ts` | 237 | 🟡 Medium |
| `adminCommandService.ts` | 126 | ✅ |
| `upload-logo.ts` | 33 | ✅ |

### Admin Module Components (`modules/admin/components/`)

| File | Lines | Status |
|---|---|---|
| `AdminCommandCenter.tsx` | **355** | 🔴 Critical |
| `AdminSettingsPanel.tsx` | **349** | 🔴 Critical |
| `PlatformOperatingDashboard.tsx` | 287 | 🟠 High |
| `TemplatesPanel.tsx` | 237 | 🟡 Medium |
| `UserManagementPanel.tsx` | 201 | 🟡 Medium |
| `EditUserDialog.tsx` | 170 | 🟡 Medium |
| `DailyActionsConfig.tsx` | 159 | 🟡 Medium |
| `TrainingModulesConfig.tsx` | 145 | 🟡 Medium |
| `OperatorDashboard.tsx` | 120 | ✅ |
| `BetaCommandCenter.tsx` | 115 | ✅ |
| `AdminCommandDashboard.tsx` | 104 | ✅ |

---

## 2. Mixed Responsibilities

### `platform-admin-service.ts` (599 lines — the worst offender)

This single file handles:
- Platform-wide stats aggregation (members, tenants, revenue, funnel stats)
- Tenant listing with filters
- AI usage analytics (cost, provider breakdown, high-cost alerts)
- Revenue dashboard
- Platform health monitoring
- Tenant health checks
- Audit log querying
- Growth metrics

**Mixed responsibilities:** 8 distinct features in one file.

### `admin-service.ts` (486 lines)

Handles:
- User management (list, create, update, delete, approve, reject)
- Training module management
- Daily action defaults
- Settings management (general, AI, content, funnel, CRM)
- Beta feature management

**Mixed responsibilities:** 5 distinct features.

### `platformOperatingService.ts` (377 lines)

Handles:
- AI profitability analysis
- Tenant health scoring
- System monitoring
- Admin override commands

**Mixed responsibilities:** 4 distinct features.

### `AdminCommandCenter.tsx` (355 lines)

Renders:
- Stats overview grid
- Tenant management table
- User management table
- AI usage charts
- Revenue dashboard
- System health indicators
- Admin command input

**Mixed responsibilities:** 7 distinct UI sections.

### `AdminSettingsPanel.tsx` (349 lines)

Renders:
- General settings form
- AI model routing config
- Content defaults
- Funnel configuration
- CRM pipeline settings
- Beta feature toggles

**Mixed responsibilities:** 6 form sections in one component.

---

## 3. Recommended Split Plan

### Phase 1 — Split Large Services (Week 1)

| Current File | Lines | Split Into |
|---|---|---|
| `platform-admin-service.ts` | 599 | `platform-stats.ts` (stats), `tenant-management.ts` (tenants), `ai-analytics.ts` (AI usage), `platform-health.ts` (health) |
| `admin-service.ts` | 486 | `user-management.ts` (users), `training-service.ts` (training), `settings-service.ts` (settings), `beta-service.ts` (beta) |
| `platformOperatingService.ts` | 377 | `ai-profitability.ts` (AI profit), `tenant-health.ts` (health), `override-commands.ts` (commands) |

### Phase 2 — Split Large Components (Week 2)

| Current Component | Lines | Split Into |
|---|---|---|
| `AdminCommandCenter.tsx` | 355 | `overview/StatsGrid.tsx`, `overview/AIUsageChart.tsx`, `overview/RevenueChart.tsx`, `overview/SystemHealth.tsx` |
| `AdminSettingsPanel.tsx` | 349 | `settings/GeneralSettings.tsx`, `settings/AIRouterConfig.tsx`, `settings/ContentDefaults.tsx`, `settings/FunnelConfig.tsx`, `settings/BetaToggles.tsx` |

### Phase 3 — Organize by Domain (Week 3)

```
src/modules/admin/
├── types/
│   └── index.ts                    ← (existing types.ts, split by domain)
├── services/
│   ├── user-management.ts          ← users CRUD + approval
│   ├── tenant-management.ts        ← tenant listing + health
│   ├── platform-stats.ts           ← aggregated stats
│   ├── ai-analytics.ts             ← AI usage + profitability
│   ├── settings-service.ts         ← settings CRUD
│   ├── training-service.ts         ← training modules + daily actions
│   ├── beta-service.ts             ← beta feature flags
│   ├── audit-service.ts            ← audit log queries
│   ├── workspace-health.ts         ← health checks
│   ├── admin-commands.ts           ← command execution
│   └── upload-logo.ts              ← (unchanged)
├── components/
│   ├── overview/
│   │   ├── StatsGrid.tsx
│   │   ├── AIUsageChart.tsx
│   │   ├── RevenueChart.tsx
│   │   └── SystemHealth.tsx
│   ├── users/
│   │   ├── UserManagementPanel.tsx
│   │   └── EditUserDialog.tsx
│   ├── approvals/
│   │   └── ApprovalQueue.tsx
│   ├── tenants/
│   │   └── TenantManagement.tsx
│   ├── analytics/
│   │   └── PlatformAnalytics.tsx
│   ├── settings/
│   │   ├── GeneralSettings.tsx
│   │   ├── AIRouterConfig.tsx
│   │   ├── ContentDefaults.tsx
│   │   └── BetaToggles.tsx
│   ├── system-health/
│   │   └── HealthDashboard.tsx
│   ├── training/
│   │   ├── TrainingModulesConfig.tsx
│   │   └── DailyActionsConfig.tsx
│   ├── AdminCommandCenter.tsx       ← thin orchestrator
│   ├── AdminSettingsPanel.tsx       ← thin orchestrator
│   └── PlatformOperatingDashboard.tsx
├── hooks/
│   ├── use-admin-stats.ts
│   ├── use-tenant-list.ts
│   └── use-settings.ts
└── index.ts                          ← barrel export
```

---

## 4. Refactor Priority

| Priority | Task | Files | Effort | Risk |
|---|---|---|---|---|
| 🔴 P1 | Split `platform-admin-service.ts` (599→4 files) | 1→4 | 3h | Low |
| 🔴 P2 | Split `admin-service.ts` (486→4 files) | 1→4 | 3h | Low |
| 🔴 P3 | Split `platformOperatingService.ts` (377→3 files) | 1→3 | 2h | Low |
| 🟠 P4 | Split `AdminCommandCenter.tsx` (355→4 files) | 1→4 | 2h | Low |
| 🟠 P5 | Split `AdminSettingsPanel.tsx` (349→5 files) | 1→5 | 2h | Low |
| 🟡 P6 | Create barrel export + reorganize dirs | 10 | 1h | Low |

---

## 5. Risk Assessment

| Risk | Status |
|---|---|
| Breaking admin page routes | ✅ Pages are already thin wrappers — no change |
| API contract changes | ✅ Services keep same exports — just split internally |
| DB schema changes | ✅ No DB changes needed |
| Component prop changes | ✅ Extracted components take same props |
| **Overall risk** | **🟢 Low** — pure decomposition, no behavior changes |

### Recommended Approach

Follow the same proven pattern as Phase 1 (funnel-builder page.tsx refactor):
1. Extract types to dedicated files
2. Extract sub-services from monolithic service files
3. Extract presentational UI from monolithic components
4. Keep orchestrators thin (< 50 lines)
5. Preserve all imports via re-exports during transition
