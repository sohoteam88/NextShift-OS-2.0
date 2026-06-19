# Journey Authority Duplicate Authorities

Scope: duplicate runtime authorities that currently answer Journey questions about progression, milestones, missions, or next actions.

## 1. Duplicate Progression Authorities

### A. `missionService` vs `missionEngineService`

Files:

- `src/modules/mission/services/mission-service.ts`
- `src/modules/mission-engine/missionEngineService.ts`

Why duplicated:

- both read and write `userProgress`
- both calculate `progressPercent`
- both calculate current/next stage semantics
- both expose route-backed mission progression APIs

Current runtime split:

- modern chain:
  - `/api/v1/mission/state`
  - `/api/v1/mission/journey`
  - `/journey`
  - `useActivation()`
  - `useDashboardMission()`
- legacy chain:
  - `/api/mission/current`
  - `/api/mission/complete`
  - `/api/mission/mode`
  - `MissionCard`
  - legacy dashboard mission widgets

Assessment:

`Confirmed duplicate progression authority`

### B. `journey-map.ts` vs `missionStages.ts`

Files:

- `src/modules/mission/constants/journey-map.ts`
- `src/modules/mission-engine/missionStages.ts`

Why duplicated:

- both define ordered stage systems
- both define completion checks
- both drive current stage, next stage, and progression semantics
- they do not use the same taxonomy

Key mismatch:

- `journey-map.ts` uses modern journey ids such as `register`, `brand_discovery`, `brand_dna`, `positioning`, `fb_page_setup`
- `missionStages.ts` uses legacy V3 mission ids such as `account_approved`, `social_setup`, `first_bio`

Assessment:

`Confirmed duplicate progression + milestone model`

## 2. Duplicate Mission Authorities

### A. `missionEngineService.getCurrentMission()` vs `mission-engine/services/mission-service.ts:getCurrentMission()`

Files:

- `src/modules/mission-engine/missionEngineService.ts`
- `src/modules/mission-engine/services/mission-service.ts`

Why duplicated:

- both answer “what is the current mission?”
- one is persisted legacy mission progression
- one is lightweight stage selector used inside `useDashboardMission()`

Current runtime split:

- persisted legacy mission:
  - `/api/mission/current`
  - `MissionCard`
- dashboard mission wrapper:
  - `useDashboardMission()`
  - `DashboardV4`
  - content/lead/CRM mission panels

Assessment:

`Confirmed duplicate mission authority`

### B. `DAY_MISSIONS` activation mission set vs dashboard mission set

Files:

- `src/modules/activation/services/activation-service.ts`
- `src/modules/mission-engine/services/mission-service.ts`

Why duplicated:

- both define the current unit of work shown to the user
- activation uses day-based missions
- dashboard mission uses stage-based missions

Current runtime split:

- activation surfaces show `dayMission`
- dashboard surfaces show `mission`

Assessment:

`Confirmed duplicate mission model`

## 3. Duplicate Next-Action Authorities

### A. `getNextJourneyAction()` vs `useDashboardMission()`

Files:

- `src/modules/journey/utils/getNextJourneyAction.ts`
- `src/modules/dashboard/hooks/useDashboardMission.ts`

Why duplicated:

- both answer “what should happen next?”
- `getNextJourneyAction()` produces CTA/title/route directly
- `useDashboardMission()` wraps that with mission selection and uses its own blended winner

Current runtime split:

- `/journey` uses `getNextJourneyAction()` directly
- `/dashboard` uses `useDashboardMission()`

Assessment:

`Confirmed duplicate next-action authority`

### B. `getNextJourneyAction()` vs `useActivation()`

Files:

- `src/modules/journey/utils/getNextJourneyAction.ts`
- `src/modules/activation/hooks/useActivation.ts`

Why duplicated:

- `useActivation()` imports `getNextJourneyAction()` and rewrites its output into day-based activation progression
- the same underlying journey truth becomes a different next-step model

Assessment:

`Confirmed duplicate next-action wrapper`

### C. `ai-coach-service.ts:getNextBestAction()` vs journey next action systems

Files:

- `src/modules/ai-coach/ai-coach-service.ts`
- `src/modules/journey/utils/getNextJourneyAction.ts`
- `src/modules/dashboard/hooks/useDashboardMission.ts`

Why duplicated:

- AI coach emits mission-aware “next best action” copy
- dashboard/journey already emit CTA and next action
- AI coach is not the main route authority, but it is still a parallel next-step narrative source

Assessment:

`Secondary duplicate next-action narrative source`

## 4. Duplicate Milestone Authorities

### A. `JOURNEY_MAP.is_milestone` vs legacy mission stage completion chain

Files:

- `src/modules/mission/constants/journey-map.ts`
- `src/modules/mission-engine/missionStages.ts`
- `src/modules/mission-engine/missionEngineService.ts`

Why duplicated:

- modern mission chain marks milestones via `is_milestone`
- legacy mission engine tracks stage completion and achievement unlocks separately
- both can be interpreted as milestone truth

Assessment:

`Confirmed duplicate milestone semantics`

### B. Activation success events vs journey completion checks

Files:

- `src/modules/activation/services/activation-service.ts`
- `src/modules/mission/constants/journey-map.ts`

Why duplicated:

- activation uses `successEvent` names like `brand_interview_completed`, `first_followup_sent`
- modern journey uses completion checks like `brand_discovery_completed`, `first_sale_completed`
- they are adjacent but not equivalent

Assessment:

`Confirmed milestone proxy duplication`

## 5. Parallel Journey-Like Sidecars

These are not necessarily the core Journey authority, but they are additional progression or milestone systems:

### A. Revenue Journey

File:

- `src/modules/revenue-activation/services/revenue-journey-service.ts`

Why relevant:

- defines separate `REVENUE_MILESTONES`
- defines separate progression score and level

Assessment:

`Parallel journey-like progression authority, scope unresolved`

### B. Team Journey Progress

File:

- `src/app/api/v1/team/journey-progress/route.ts`

Why relevant:

- projects journey progression for members
- not a primary source itself, but confirms that modern journey progression already has downstream projections

Assessment:

`Consumer projection, not a separate primary authority`

## Final Duplicate Authority Assessment

Confirmed duplicate zones:

1. progression:
   - `missionService`
   - `missionEngineService`
   - `journey-map.ts`
   - `missionStages.ts`
2. mission:
   - legacy mission engine mission
   - dashboard mission selector
   - activation day mission
3. next action:
   - `getNextJourneyAction()`
   - `useDashboardMission()`
   - `useActivation()`
   - AI coach mission advice
4. milestones:
   - `JOURNEY_MAP.is_milestone`
   - legacy mission completion chain
   - activation success events

The strongest duplicate authority problem is still:

`modern mission chain vs legacy mission chain`
