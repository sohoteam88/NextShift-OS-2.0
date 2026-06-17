# V6.1 Pre-Flight Report

## 1. Authority Map

### Real progression authority
**Authority Confirmed: YES**

`src/modules/mission/services/mission-service.ts` owns progression state today through `public.userProgress`.

Evidence:
- `getProgress()` reads and creates `prisma.userProgress`
- `getState()` derives current stage, progress percent, completed checks, and estimated next steps from `userProgress`
- `completeCheck()` mutates `userProgress`
- `setMode()` mutates `userProgress`
- `skipStage()` routes back into `completeCheck()`

### Evolution authority status
Current evolution logic is **derived**, not authoritative.

`src/modules/user-evolution/services/user-level-service.ts` computes level and unlocks from progress inputs, but it is not the persistence owner.

## 2. Dependency Graph

### Evolution consumers

`Sidebar`
↓
`useUserEvolution()`
↓
`user-level-service` + `unlock-service`
↓
level selection and module access

`DashboardV4`
↓
`useUserEvolution()`
↓
level display, unlocked modules, AI coach persona

`JourneyPage`
↓
`useMissionState()`
↓
`missionService`
↓
progress and next-step derivation

`Lead Engine`
↓
`useLeadEngine()`
↓
`useUserEvolution()`
↓
lead lock state

`CRM Engine`
↓
`useCRMEngine()`
↓
`useUserEvolution()`
↓
CRM lock state

`Sales Engine`
↓
`useSalesEngine()`
↓
`useUserEvolution()`
↓
sales lock state

`Team Engine`
↓
`useTeamEngine()`
↓
`useUserEvolution()`
↓
team lock state

`AI Coach / roadmap / content surfaces`
↓
`useUserEvolution()`
↓
module gating and display level

### Mission consumers

`DashboardV4`
↓
`useDashboardMission()`
↓
`useMissionState()` + `getNextJourneyAction()` + `getUserLevel()` + `getCurrentMission()` + `getAICoachAdvice()`

`JourneyPage`
↓
`useMissionState()`
↓
`getNextJourneyAction()`

`Sidebar`
↓
`useMissionState()`
↓
guided stage display

`Roadmap / Activation / AI Coach`
↓
mission and evolution derived helpers

## 3. Unlock Inventory

| Surface | Unlock Source | Authority |
| --- | --- | --- |
| Content | `useContentEngine()` -> `useUserEvolution()` -> `isModuleUnlocked('content-engine')` | Evolution-derived |
| Leads | `useLeadEngine()` -> `useUserEvolution()` -> `getLockedReason('lead-magnet')` | Evolution-derived |
| CRM | `useCRMEngine()` -> `useUserEvolution()` | Evolution-derived |
| Sales | `useSalesEngine()` -> `useUserEvolution()` | Evolution-derived |
| Team | `useTeamEngine()` -> `useUserEvolution()` | Evolution-derived |

### Sidebar unlock source
`src/components/layouts/Sidebar.tsx` selects sidebar variants from `evolution.level`, using:
- `EXPLORER_SIDEBAR`
- `BUILDER_SIDEBAR`
- `OPERATOR_SIDEBAR`
- `ADVANCED_SIDEBAR`

The sidebar is currently evolution-driven, not route-driven.

## 4. Authorization Inventory

| Route | Authorization Source |
| --- | --- |
| Dashboard | `getAuthUser()` + role branching in `src/app/(auth)/dashboard/page.tsx` |
| Journey | auth-only page shell + `requireAuthApi()` on mission APIs |
| CRM | auth-only page shell; domain APIs enforce auth and some role checks |
| Sales | auth-only page shell; domain APIs / engine gating are evolution-driven |
| Team | `getAuthUser()` + role redirect in `src/app/(auth)/team/page.tsx`; team APIs require auth and team roles |

### Authorization style
- **Role-based**: Dashboard, Team
- **Evolution-based**: sidebar unlocks, CRM Engine, Sales Engine, Team Engine, Lead Engine, Content Engine
- **Mission-based**: Journey and mission-driven UI flows

## 5. DTO Feasibility

Proposed DTO:

```ts
interface EvolutionSnapshot {
  level: string;
  progressPercentage: number;
  currentStage: string;
  nextLevel: string | null;
  unlockedModules: string[];
  completedMissions: number;
  totalMissions: number;
}
```

| Field | Existing Source | Missing? |
| --- | --- | --- |
| `level` | `user-level-service.getUserLevel()` / `useUserEvolution()` | No |
| `progressPercentage` | `user-level-service` / mission progress percent | No |
| `currentStage` | `missionService.getState()` / `useMissionState()` | No |
| `nextLevel` | derivable from current level ordering | No new persistence, but no dedicated field today |
| `unlockedModules` | `unlock-service.getUnlockedModules()` | No |
| `completedMissions` | mission progress / completed checks count | No, but semantics need normalization |
| `totalMissions` | milestone / mission map total | No, but semantics need normalization |

### Feasibility verdict
The DTO is feasible without new persistence.
The only work required is normalization and a canonical adapter.

## 6. Risk Assessment

### Evolution Snapshot
**Risk: HIGH**

Reason:
- it affects Sidebar, Dashboard, Journey, CRM Engine, Sales Engine, Team Engine, and route gating
- it is the root of many downstream unlock inconsistencies

### Sidebar Migration
**Risk: MEDIUM**

Reason:
- read-only migration
- but high surface area and many visible routes

### Dashboard Migration
**Risk: HIGH**

Reason:
- Dashboard currently mixes mission state, evolution state, and quick stats
- contract mismatches already exist between data shape and UI expectations

### Journey Migration
**Risk: MEDIUM**

Reason:
- already mission-driven today
- should be simpler once a canonical DTO exists

### Route Guard Migration
**Risk: MEDIUM**

Reason:
- route guards are split between auth layout, role checks, and evolution-based locks
- but the change is mostly structural, not data-model heavy

## 7. GO / NO-GO Decision

## Final Decision

```txt
GO
```

### Evidence
- `missionService` is confirmed as the current persistence authority for progression state.
- `userEvolutionService` can be projection-only because all needed inputs already exist in `userProgress`, mission state, and unlock logic.
- Unlock logic is mapped and currently duplicated, so it can be consolidated behind the planned adapter/service boundary.
- Route authorization is mapped: dashboard and team have explicit role gates; journey, CRM, sales, and evolution-driven surfaces are already observable and separable.
- The proposed `EvolutionSnapshot` is feasible with existing sources.
- Migration risk is high, but it is understood and staged correctly for a sprint-based adapter-first refactor.

### Required caution
This is a **GO for Sprint 1**, not a claim that the system is already consistent.
The current runtime still has duplicate consumers, but the pre-flight conditions are sufficient to start the consolidation sprint safely.

