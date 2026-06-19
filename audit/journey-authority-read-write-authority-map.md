# Journey Authority Read / Write Authority Map

## Overview

This map separates:

- read authority: who consumers trust today
- write authority: who mutates progression or mission truth today

## 1. Progression

### Read Authority

Primary read authorities in production:

- `missionService.getState()` via `/api/v1/mission/state`
- `missionEngineService.getMissionProgress()` via `/api/mission/current`
- `getProgressPercent()` and `getStageById()` helpers in team reporting
- local estimates in `workspaceHealthService`
- derived activation progress in `useActivation()`

Main trusting consumers:

- `/journey`
- `useMissionState()`
- `useDashboardMission()`
- `DashboardV4`
- `useActivation()`
- `MissionCard`
- legacy mission widgets
- `TeamJourneyProgress`
- admin workspace overview
- AI workforce routes

### Write Authority

Writers:

- `missionService.completeCheck()`
- `missionService.setMode()`
- `missionService.skipStage()`
- `missionEngineService.completeCurrentMission()`
- `missionEngineService.switchMissionMode()`

Judgment:

- progression writes are duplicated across modern and legacy mission services

## 2. Milestones

### Read Authority

Primary reads:

- `missionService.completedChecks`
- `missionService.getJourneyMap()`
- legacy achievements/progress from `missionEngineService`
- activation `DAY_MISSIONS`
- revenue milestones

Trusting consumers:

- `/journey`
- `useDashboardMission()`
- `useActivation()`
- `MissionCard`
- legacy mission widgets
- journey map and team reporting surfaces

### Write Authority

Writers:

- `missionService.completeCheck()`
- `missionEngineService.completeCurrentMission()`

Non-authority milestone models:

- `DAY_MISSIONS`
- revenue milestones

Judgment:

- canonical-style milestone writes happen in `missionService`
- legacy milestone writes remain alive in `missionEngineService`
- activation and revenue milestone sets are read-only sidecar models

## 3. Missions

### Read Authority

Dashboard mission read path:

- dashboard `getCurrentMission()` through `useDashboardMission()`

Activation mission read path:

- `DAY_MISSIONS` through `useActivation()`

Legacy mission read path:

- `missionEngineService.getCurrentMission()` through `/api/mission/current`

Trusting consumers:

- `DashboardV4`
- `ContentCommandCenter`
- `ContentDashboard`
- `LeadDashboard`
- `CRMDashboard`
- `ActivationDashboard`
- `MissionCard`
- legacy dashboard mission widgets

### Write Authority

Actual mission writes:

- `missionEngineService.completeCurrentMission()`
- `missionEngineService.switchMissionMode()`
- `missionService.setMode()`
- `missionService.completeCheck()` indirectly changes downstream mission selection by changing stage/check truth

Judgment:

- mission selection is mostly read-time derivation
- mission state mutation is split between modern mission check writes and legacy mission-engine mission writes

## 4. Next Actions

### Read Authority

Base next-action reader:

- `getNextJourneyAction()`

Wrapper readers:

- `useDashboardMission()`
- `useActivation()`

Advisory readers:

- `getAICoachAdvice()`
- `getNextBestAction()`
- AI workforce stage routing

Trusting consumers:

- `/journey`
- `DashboardV4`
- activation dashboard
- dashboard CTA panels
- AI coach surfaces
- AI workforce routes

### Write Authority

There is no persistence writer for next actions.

Next actions are derived at read time from:

- progress state
- completed checks
- mission wrapper logic
- AI advice helpers

Judgment:

- next action is a read-time authority problem, not a write-time persistence problem

## 5. Surface-Level Read / Write Winners

| Surface | Read Authority Winner | Write Authority Winner |
| --- | --- | --- |
| `/journey` | `missionService` + `getNextJourneyAction()` | `missionService.completeCheck()` |
| `/dashboard` | `useDashboardMission()` and sometimes `useActivation()` | upstream `missionService.completeCheck()`; no dashboard-local writer |
| activation surfaces | `useActivation()` | upstream `missionService.completeCheck()`; activation itself does not persist journey truth |
| legacy mission UI | `missionEngineService` | `missionEngineService.completeCurrentMission()` |
| team journey reporting | journey-map helpers + `userProgress` | none |
| admin workspace reporting | local estimate helpers + `userProgress` | none |
| AI coach | dashboard mission wrapper / mission id | none |
| AI workforce | raw `userProgress.currentStageId` | none |

## Final Read / Write Assessment

Journey read authority is fragmented.

Journey write authority is also duplicated:

- modern writes: `missionService`
- legacy writes: `missionEngineService`

For missions and next actions, most of the conflict is on the read side, not the write side.

For progression and milestones, both read and write authority are still split.
