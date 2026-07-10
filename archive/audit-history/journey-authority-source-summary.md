# Journey Authority Source Summary

Scope: factual summary of current runtime sources that answer Journey Authority questions:

- what should happen next
- where is the user in the journey
- which milestone is complete
- what mission is current

## Source Counts

| Authority Role | Active Sources | Legacy Sources | Notes |
| --- | --- | --- | --- |
| Progression | 6 | 2 | mission chain, activation chain, dashboard wrapper, team projection, revenue sidecar |
| Milestones | 5 | 2 | journey map, mission chain, activation success events, revenue milestones |
| Mission | 4 | 2 | dashboard mission selector, activation day mission set, legacy mission engine mission |
| Next Action | 4 | 1 | `getNextJourneyAction`, dashboard wrapper, activation wrapper, AI coach copy |

## Current Runtime Winners By Surface

| Surface | Effective Source | What It Decides |
| --- | --- | --- |
| `/journey` | `missionService.getState()` + `getNextJourneyAction()` | next action CTA, progress step, stage label |
| `/dashboard` | `useDashboardMission()` | current mission, CTA, progress stage, coach message |
| Activation surfaces | `useActivation()` | activation day, day mission, activation level |
| Modern mission APIs | `missionService` + `JOURNEY_MAP` | progression, milestones, ETA, journey map |
| Legacy mission APIs | `missionEngineService` + `missionStages.ts` | legacy current mission, progress, achievements |
| Team journey reporting | `/api/v1/team/journey-progress` using `journey-map.ts` helpers | member progress and current stage |

## Modern Journey Chain

The strongest active modern chain is:

`JOURNEY_MAP -> missionService -> /api/v1/mission/state + /api/v1/mission/journey -> useMissionState() -> getNextJourneyAction() -> /journey`

This chain currently owns the cleanest answer to:

`what should happen next?`

for the dedicated Journey page.

## Dashboard Journey Chain

Dashboard does not use the Journey page chain directly.

It uses:

`useMissionState() + getNextJourneyAction() + dashboard getCurrentMission() + AI coach advice -> useDashboardMission()`

That means dashboard has its own journey wrapper, not the same source chain as `/journey`.

## Activation Journey Chain

Activation also rewrites journey semantics:

`useMissionState() + getNextJourneyAction() + DAY_MISSIONS + activation score helpers -> useActivation()`

This means activation is not only a consumer. It is also a parallel derived journey model.

## Legacy Mission Chain

The legacy chain is still alive:

`missionStages.ts -> missionEngineService -> /api/mission/* -> MissionCard and legacy dashboard widgets`

This remains the clearest duplicate authority zone.

## Key Duplicate Authority Findings

### 1. Two progression engines

- modern:
  - `journey-map.ts`
  - `missionService`
- legacy:
  - `missionStages.ts`
  - `missionEngineService`

### 2. Three mission models

- modern stage progression in `missionService`
- dashboard mission model in `mission-engine/services/mission-service.ts`
- activation `DAY_MISSIONS`

### 3. Three next-action layers

- `getNextJourneyAction()`
- `useDashboardMission()`
- `useActivation()`

AI coach adds a fourth narrative layer, but not the primary route authority.

## Source Assessment By Keep / Adapter / Retire

| Source | Assessment | Reason |
| --- | --- | --- |
| `journey-map.ts` | KEEP | strongest modern progression and milestone model |
| `missionService` | KEEP | strongest active persisted journey progression authority |
| `getNextJourneyAction()` | KEEP | strongest explicit next-action resolver for `/journey` |
| `mission-engine/services/mission-service.ts` | ADAPTER | useful dashboard mission selector, but not clean canonical journey authority |
| `useDashboardMission()` | ADAPTER | high-fan-out dashboard wrapper; should become consumer of canonical Journey state later |
| `activation-service.ts` | ADAPTER | separate activation taxonomy that must be bridged, not promoted |
| `useActivation()` | ADAPTER | derived consumer-wrapper, not persistence authority |
| `missionStages.ts` | RETIRE | duplicate legacy stage map |
| `missionEngineService` | RETIRE | duplicate legacy progression/mission authority |
| `ai-coach-service.ts` | PARTIAL / ADAPTER | advisory narrative layer, not core journey truth |
| `revenue-journey-service.ts` | UNRESOLVED | separate progression system, not yet clearly inside or outside Journey scope |

## Final Source Assessment

`Journey Authority is not a single runtime source today.`

The strongest modern authority chain is:

`journey-map.ts -> missionService -> getNextJourneyAction()`

But current runtime still contains:

- a legacy mission chain
- a dashboard mission wrapper chain
- an activation day-mission chain

So Journey source discovery is not “which file wins globally,” but “which chain currently wins on which surface.”
