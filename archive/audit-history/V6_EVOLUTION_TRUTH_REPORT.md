# V6 Evolution Truth Report

Audit only. No code was modified.

## 1) Evolution Sources

| File | Function / System | Purpose | Used By |
|---|---|---|---|
| `src/modules/mission/services/mission-service.ts` | `missionService.getProgress`, `getState`, `completeCheck` | Primary mission-state store in `public.userProgress`; drives journey stage, progress %, mode, completed checks | `useMissionState`, `useDashboardMission`, `useActivation`, `useGrowthRoadmap`, sidebar mission view, journey UI |
| `src/modules/user-evolution/services/user-level-service.ts` | `getUserLevel` | Converts milestone-ish inputs into `Explorer / Builder / Operator / Leader` | `useUserEvolution`, `useDashboardMission`, `useActivation`, `useGrowthRoadmap`, unlock hooks |
| `src/modules/user-evolution/services/unlock-service.ts` | `getUnlockedModules`, `isModuleUnlocked`, `getLockedReason` | Module-level unlock matrix by `UserLevel` | `useUserEvolution`, `useLeadEngine` and other feature gates |
| `src/modules/auth/services/auth-service.ts` | `getAuthUser` | Auth identity and DB role lookup from `public.user` | `AuthenticatedLayout`, server pages, API guards |
| `src/modules/auth/middleware/require-auth-api.ts` | `requireAuthApi`, `requireRoleApi`, `requireTenantApi` | API authorization by login, role, tenant | Most `/api/v1/**` route handlers |
| `src/modules/activation/services/activation-service.ts` | `getActivationDay`, `getCurrentDayMission`, `getActivationLevel` | 7-day activation program and activation tier | `useActivation` |
| `src/modules/growth-roadmap/services/roadmap-service.ts` | `getGrowthRoadmapState` | 15-step roadmap that combines mission + evolution into a roadmap state | `useGrowthRoadmap` |
| `src/modules/mission-engine/services/mission-service.ts` | `getCurrentMission` | Stage selector used by dashboard mission copy | `useDashboardMission` |
| `src/modules/crm-engine/hooks/useCRMEngine.ts` | `useCRMEngine` | CRM lock state and feature exposure | `CRMDashboard` |
| `src/modules/sales-engine/hooks/useSalesEngine.ts` | `useSalesEngine` | Sales lock state and feature exposure | `SalesDashboard` |
| `src/modules/team-engine/hooks/useTeamEngine.ts` | `useTeamEngine` | Team lock state and feature exposure | `TeamDashboard` |
| `src/modules/lead-engine/hooks/useLeadEngine.ts` | `useLeadEngine` | Lead engine lock state and advanced visibility | `LeadDashboard` |

## 2) Level Systems

### A. Mission System
- **Purpose:** Track journey completion and stage progression.
- **Inputs:** `completedChecks`, `currentStageId`, `mode`, `tenantId`, `userId`.
- **Outputs:** `currentStage`, `nextStage`, `progressPercent`, `isJourneyComplete`, `completedChecks`.
- **Database tables:** `public.userProgress`.
- **Services:** `src/modules/mission/services/mission-service.ts`.
- **Hooks:** `src/modules/mission/hooks/use-mission.ts`.
- **Routes:** `/api/v1/mission/state`, `/api/v1/mission/journey`, `/api/v1/mission/complete-check`, `/api/v1/mission/mode`.

### B. User Evolution System
- **Purpose:** Derive `Explorer / Builder / Operator / Leader`.
- **Inputs:** mission-derived completion hints plus counts for content, leads, customers, team members, CRM, follow-up.
- **Outputs:** `level`, `completedMilestones`, `unlockedModules`, `nextMilestone`, `progressPercentage`.
- **Database tables:** Indirect only. It reads mission state through `useMissionState()`; it does not own a dedicated persisted level field in the inspected code.
- **Services:** `src/modules/user-evolution/services/user-level-service.ts`, `unlock-service.ts`.
- **Hooks:** `src/modules/user-evolution/hooks/useUserEvolution.ts`.
- **Routes:** None directly; it is a client-side derivation layer.

### C. Role System
- **Purpose:** Server-side access control and dashboard variant selection.
- **Inputs:** `public.user.role`, `public.user.status`, `tenantId`.
- **Outputs:** authenticated user object, forbidden/redirect decisions.
- **Database tables:** `public.user`.
- **Services:** `src/modules/auth/services/auth-service.ts`, `auth-routing.ts`.
- **Hooks:** none.
- **Routes:** `AuthenticatedLayout`, server pages, API route guards.

### D. Activation System
- **Purpose:** 7-day onboarding / activation pacing.
- **Inputs:** mission checks.
- **Outputs:** `currentDay`, `activationLevel`, `score`, `isComplete`.
- **Database tables:** indirect through mission state.
- **Services:** `src/modules/activation/services/activation-service.ts`.
- **Hooks:** `src/modules/activation/hooks/useActivation.ts`.

### E. Growth Roadmap System
- **Purpose:** 15-step business roadmap that overlays evolution on top of mission state.
- **Inputs:** mission checks, quick stats, counts, user level.
- **Outputs:** roadmap steps and locked/unlocked state.
- **Database tables:** indirect through mission and team summary APIs.
- **Services:** `src/modules/growth-roadmap/services/roadmap-service.ts`.
- **Hooks:** `src/modules/growth-roadmap/hooks/useGrowthRoadmap.ts`.

## 3) Dependency Graph

```text
public.user.role / status
  └─> getAuthUser()
        └─> AuthenticatedLayout
              └─> dashboard page role branching
              └─> requireRoleApi() in API routes

public.userProgress.completedChecks / currentStageId / mode
  └─> missionService.getState()
        └─> useMissionState()
              ├─> useDashboardMission()
              ├─> useActivation()
              ├─> useGrowthRoadmap()
              ├─> useUserEvolution()
              └─> Sidebar member mission view

useMissionState() + counts + mission checks
  └─> getUserLevel()
        └─> useUserEvolution()
              ├─> unlock-service
              ├─> useLeadEngine()
              ├─> useCRMEngine()
              ├─> useSalesEngine()
              └─> useTeamEngine()

useUserEvolution() / mission state
  └─> Sidebar level-based navigation

requireAuthApi() + requireRoleApi()
  └─> API authorization for CRM / Sales / Team / Admin capabilities
```

## 4) Unlock Logic Map

| Area | Route / Surface | Route Guard | Permission Check | Evolution Check | Feature Flag | Database Field Used |
|---|---|---|---|---|---|---|
| Dashboard | `/dashboard` | `src/app/(auth)/dashboard/page.tsx` | None in page | Role-driven view selection only | None | `public.user.role` |
| Journey | `/journey` | `AuthenticatedLayout` | `resolveAuthRedirect()` for pending/suspended | Uses `useMissionState()` and journey progress | None | `public.userProgress.completedChecks`, `currentStageId`, `mode` |
| Sidebar | `src/components/layouts/Sidebar.tsx` | `AuthenticatedLayout` | Member/leader/operator split by role, plus mission sidebar for members | `useUserEvolution()` selects Explorer/Builder/Operator/Advanced nav | None | `public.user.role`, mission state, mission-derived evolution |
| Content | `/content-engine` | `AuthenticatedLayout` | None in page file | Feature unlock comes from sidebar and content engine hooks | None | mission state + evolution level |
| Lead | `/leads` | `AuthenticatedLayout` | None in page file | `useLeadEngine()` gates locked view by evolution level | None | mission-derived `UserLevel` |
| CRM | `/customers` | `AuthenticatedLayout` | API/data paths use `requireRoleApi()` where relevant; page itself has no explicit guard | `useCRMEngine()` gates locked view by evolution level | None | mission-derived `UserLevel` |
| Sales | `/sales` | `AuthenticatedLayout` | Page file has no explicit guard; backend APIs may be role-gated | `useSalesEngine()` gates locked view by evolution level | None | mission-derived `UserLevel` |
| Team | `/team/growth` | `AuthenticatedLayout` | Page file has no explicit guard; backend APIs may be role-gated | `useTeamEngine()` gates locked view by evolution level | None | mission-derived `UserLevel` |

### Important implementation detail
- `/app/(auth)/dashboard/page.tsx` chooses dashboard variant by **role**, not by evolution level.
- CRM / Sales / Team unlock surfaces choose lock state by **evolution level**.
- API authorization is still mostly **role-based**.

## 5) Conflict Analysis

### Can these disagree?
**Yes.**

### Exact mismatch path
1. `missionService.getState()` reads `public.userProgress` and yields journey progress.
2. `useUserEvolution()` maps that journey progress into a synthetic `UserLevel`.
3. `useDashboardMission()` also maps the same mission state into dashboard stage copy.
4. `dashboard/page.tsx` uses `getAuthUser().role` to choose the rendered dashboard component.
5. `CRMDashboard`, `SalesDashboard`, and `TeamDashboard` lock themselves with `useCRMEngine()`, `useSalesEngine()`, and `useTeamEngine()`, which use `useUserEvolution().level`.
6. API/data access for many endpoints still uses `requireRoleApi()` on `public.user.role`.

### Why disagreement happens
- Journey progression is derived from **mission state**.
- Unlock screens are derived from **mission state -> user evolution -> level**.
- Route/data authorization is derived from **database role**.
- These are related, but not the same input and not the same authority.

## 6) Production Truth

### What currently controls each layer

| User state | Current authority | Evidence |
|---|---|---|
| Journey stage / progress | `public.userProgress` via `missionService` | `src/modules/mission/services/mission-service.ts:54-97` |
| Explorer / Builder / Operator / Leader label | `getUserLevel()` derived from mission state and counts | `src/modules/user-evolution/services/user-level-service.ts:58-105` |
| Sidebar navigation for members | `useUserEvolution()` level plus mission state | `src/components/layouts/Sidebar.tsx:348-405` |
| Dashboard variant | `public.user.role` | `src/app/(auth)/dashboard/page.tsx:40-70` |
| CRM lock state | `useCRMEngine()` / `useUserEvolution()` | `src/modules/crm-engine/hooks/useCRMEngine.ts:8-29` |
| Sales lock state | `useSalesEngine()` / `useUserEvolution()` | `src/modules/sales-engine/hooks/useSalesEngine.ts:7-23` |
| Team lock state | `useTeamEngine()` / `useUserEvolution()` | `src/modules/team-engine/hooks/useTeamEngine.ts:7-24` |
| API authorization | `requireAuthApi()` + `requireRoleApi()` | `src/modules/auth/middleware/require-auth-api.ts:5-41` |

### Production behavior observed in the UI audit
- Journey and dashboard can show advanced progression.
- CRM, Sales, and Team can still render locked states.
- That is consistent with the code split above: journey uses mission/evolution, while access to some areas is still role-gated or separately level-gated.

## 7) Single Source Of Truth Recommendation

### Recommendation
Use **mission progress** as the canonical persistence layer, and derive all user progression, evolution level, sidebar unlocks, and UI feature unlocks from it.

### Keep / Merge / Remove

| System | Recommendation | Reason |
|---|---|---|
| `missionService` / `public.userProgress` | **KEEP** | This is the only clearly persisted progression store inspected in this audit |
| `getUserLevel()` / `unlock-service` | **MERGE** | Good derivation layer, but should be a pure projection of canonical mission state |
| `activation-service` | **MERGE** | Useful as a view over mission progress, not a separate authority |
| `growth-roadmap-service` | **MERGE** | Useful as a view over mission progress, not a separate authority |
| `dashboard/page.tsx` role branching | **MERGE** | Should not be the authority for progression; it should read the canonical progression model |
| `requireRoleApi()` for progression-related routes | **MERGE** | Keep for security, but do not let it define evolution status |
| disparate page-level lock logic in CRM/Sales/Team | **MERGE** | Replace with one shared progression projection |

### What the SSOT should be
1. Persist progression in `public.userProgress`.
2. Derive `UserLevel` from mission state only.
3. Use that derived level everywhere for unlock UI and route decisions.
4. Keep `role` for administrative/security authorization only.

## 8) Refactor Risk Assessment

### Low risk
- Replacing duplicate lock messages with one shared hook.
- Standardizing lock text and unlock thresholds.

### Medium risk
- Making `/dashboard`, `/customers`, `/sales`, `/team/growth`, and sidebar all read one shared progression projection.
- Aligning server routes with the same progression model without breaking admin/operator security.

### High risk
- Changing the auth model so role and progression are no longer mixed anywhere without first auditing every `requireRoleApi()` caller.
- Moving progression off mission state before verifying all completion events and historical `userProgress` rows still map cleanly.

## Final Answers

### 1. Who is the real authority for user progression?
**D. Multiple Conflicting Systems.**

Evidence:
- Mission authority: `missionService` / `public.userProgress`.
- Evolution authority: `getUserLevel()` derived from mission state.
- Route authorization authority: `getAuthUser().role` and `requireRoleApi()`.
- Feature lock authority: per-feature hooks reading `useUserEvolution()`.

### 2. Why can a user reach Leader Journey but still see CRM Locked / Sales Locked / Team Locked?
Because the app is using different authorities in different places:
- `Journey` and the dashboard mission copy are driven by `public.userProgress` and mission-derived progress.
- `CRM`, `Sales`, and `Team` lock screens are driven by `useUserEvolution().level`.
- Some route/data paths still use `public.user.role`.

Exact files:
- Journey state: `src/modules/mission/services/mission-service.ts`
- Evolution derivation: `src/modules/user-evolution/services/user-level-service.ts`
- CRM lock: `src/modules/crm-engine/hooks/useCRMEngine.ts` + `src/modules/crm-engine/components/CRMDashboard.tsx`
- Sales lock: `src/modules/sales-engine/hooks/useSalesEngine.ts` + `src/modules/sales-engine/components/SalesDashboard.tsx`
- Team lock: `src/modules/team-engine/hooks/useTeamEngine.ts` + `src/modules/team-engine/components/TeamDashboard.tsx`
- Role-based dashboard branching: `src/app/(auth)/dashboard/page.tsx`

### 3. What should become the Single Source Of Truth?
`public.userProgress` as the persisted progression record, with one shared derivation layer that computes:
- current mission stage
- user level
- unlock state
- sidebar state
- route visibility

Keep `role` for security and admin permissions only. Do not use it as progression logic.
