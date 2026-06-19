# Journey Authority Consumer Summary

## Consumer Inventory Summary

Current Journey consumers are split across five live clusters:

1. Modern mission state consumers built on `missionService`
2. Dashboard wrappers that mix mission, journey, activation, and AI copy
3. Activation consumers that derive a day-based program from journey state
4. Legacy mission-engine consumers still reading `/api/mission/*`
5. Reporting and AI surfaces that consume stage/progress without owning mission state

The runtime does not have one clean consumer path. It has one strongest modern path plus several parallel readers.

## Dashboard Consumers

Primary dashboard consumers:

- `src/modules/dashboard/hooks/useDashboardMission.ts`
- `src/modules/dashboard/components/DashboardV4.tsx`
- `src/modules/content-engine/components/ContentCommandCenter.tsx`
- `src/modules/content-engine/components/ContentDashboard.tsx`
- `src/modules/lead-engine/components/LeadDashboard.tsx`
- `src/modules/crm-engine/components/CRMDashboard.tsx`
- `src/components/layouts/Sidebar.tsx`

Findings:

- `useDashboardMission()` is the main mixed-authority dashboard adapter.
- It reads canonical journey state from `useMissionState()`.
- It derives next action from `getNextJourneyAction()`.
- It derives dashboard mission from the separate dashboard helper `getCurrentMission()`.
- It layers AI coach text from `getAICoachAdvice()`.
- `DashboardV4` adds one more layer by also reading `useActivation()`.

Result:

- Dashboard is not a direct Journey consumer.
- Dashboard is a wrapper stack that mixes progression, mission, next action, and activation semantics before rendering.

## Journey Consumers

Primary journey consumers:

- `src/modules/mission/hooks/use-mission.ts`
- `src/app/(auth)/journey/page.tsx`
- `src/app/api/v1/mission/state/route.ts`
- `src/app/api/v1/mission/journey/route.ts`
- `src/app/api/v1/mission/complete-check/route.ts`
- `src/app/api/v1/mission/mode/route.ts`
- `src/app/api/v1/team/journey-progress/route.ts`
- `src/modules/team/components/TeamJourneyProgress.tsx`

Findings:

- The modern journey read path is `missionService -> /api/v1/mission/* -> useMissionState()/useJourneyMap()`.
- `/journey` does not render directly from `JOURNEY_MAP`; it reads mission state and then converts it into a simplified next-step action through `getNextJourneyAction()`.
- Team journey progress is a projection surface. It consumes stage id plus progress helpers, not mission selection.

Result:

- Journey page and journey APIs are active modern consumers.
- Team journey progress is an active reporting consumer.

## Activation Consumers

Primary activation consumers:

- `src/modules/activation/hooks/useActivation.ts`
- `src/modules/activation/components/ActivationDashboard.tsx`
- `src/modules/dashboard/components/DashboardV4.tsx`

Findings:

- `useActivation()` is not an independent authority.
- It reads canonical mission state, then remaps it through `getNextJourneyAction()`, then remaps again through `DAY_MISSIONS` and `getActivationLevel()`.
- Activation progression is therefore a derived consumer chain, not a source.

Result:

- Activation is active.
- Activation is also one of the most important mixed-authority consumers because it converts journey progression into a different day-based model.

## Mission Consumers

Primary mission consumers:

- `src/modules/mission-engine/components/MissionCard.tsx`
- `src/app/api/mission/current/route.ts`
- `src/app/api/mission/complete/route.ts`
- `src/app/api/mission/mode/route.ts`
- `src/modules/dashboard/components/JourneyProgress.tsx`
- `src/modules/dashboard/components/TodaysActionCard.tsx`
- `src/modules/dashboard/components/JourneyProgressMap.tsx`
- `src/modules/dashboard/components/MissionCoachHero.tsx`
- `src/modules/dashboard/components/AiRecommendationPanel.tsx`

Findings:

- These surfaces still sit on the legacy `missionEngineService` path.
- They read legacy `currentMission`, legacy progress, legacy achievements, and legacy `missionStages`.
- They are not passive leftovers. Several of them still render mission progress and CTA behavior.

Result:

- Legacy mission consumers remain live.
- `MissionCard` and legacy mission routes are the clearest duplicate runtime path next to the modern missionService path.

## AI Consumers

Primary AI consumers:

- `src/modules/ai-coach/ai-coach-service.ts`
- `src/modules/dashboard/hooks/useDashboardMission.ts`
- `src/app/api/v1/ai-workforce/route.ts`
- `src/app/api/v1/ai-workforce/execute/route.ts`

Findings:

- AI coach copy currently consumes mission identity, not canonical journey state directly.
- AI workforce routing consumes `userProgress.currentStageId` directly and uses that stage to recommend or execute agents.
- AI surfaces therefore consume Journey authority through two different interfaces:
  - mission-oriented dashboard adapters
  - direct stage-oriented agent routing

Result:

- AI is an active Journey consumer cluster.
- AI does not yet read a single `JourneyState` projection.

## Mixed Authority Consumers

The highest-mix consumers are:

- `useDashboardMission()`
- `DashboardV4`
- `useActivation()`
- `ActivationDashboard`
- `JourneyPage`
- `workspaceHealthService`

Why they are mixed:

- `useDashboardMission()` combines mission state, journey next action, dashboard mission selection, and AI coach text.
- `DashboardV4` combines dashboard mission plus activation gating.
- `useActivation()` combines mission state, next action heuristics, day missions, and activation level scoring.
- `JourneyPage` reads progress from mission state but uses threshold heuristics in `getNextJourneyAction()`.
- `workspaceHealthService` estimates progress from `currentStageId` plus local heuristics instead of using canonical journey percent.

## Consumer Migration Map

Eventual `JourneyState` target mapping by consumer class:

| Consumer Class | Eventual JourneyState Fields |
| --- | --- |
| Journey APIs and hooks | `progression`, `milestones` |
| Journey page | `progression`, `milestones`, `nextAction` |
| Dashboard mission wrapper | `progression`, `milestones`, `mission`, `nextAction` |
| Activation surfaces | `progression`, `mission`, `nextAction` |
| Legacy mission widgets | `progression`, `milestones`, `mission` |
| AI coach surfaces | `mission`, `nextAction` |
| AI workforce routing | `progression`, `nextAction` |
| Team/admin reporting | `progression` |

## Unresolved Consumer Findings

1. Duplicate consumer paths still exist:
   - modern `missionService` chain
   - legacy `missionEngineService` chain

2. Dashboard wrappers are still stacking different authorities:
   - canonical mission state
   - simplified next-action heuristics
   - dashboard mission mapping
   - AI coach text
   - activation overlay

3. Admin reporting does not consume canonical progress directly:
   - `workspaceHealthService` estimates journey progress locally

4. AI routing has no unified journey adapter:
   - AI coach consumes mission identity
   - AI workforce consumes raw current stage

5. Revenue activation remains a parallel sidecar:
   - it models milestone/progress semantics outside the main journey chain
