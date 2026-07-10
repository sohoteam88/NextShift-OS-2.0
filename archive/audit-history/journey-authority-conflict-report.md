# Journey Authority Conflict Report

## Conflict Summary

Journey conflicts are not theoretical. They are active runtime splits.

The main conflict pattern is:

- one modern progression source
- one legacy progression source
- several wrapper-level mission and next-action reinterpretations

## 1. Duplicate Progression Chains

### Conflict A: modern mission chain vs legacy mission chain

Modern:

- `journey-map.ts`
- `missionService`
- `/api/v1/mission/*`
- `useMissionState()`

Legacy:

- `missionStages.ts`
- `missionEngineService`
- `/api/mission/*`
- `useMissionCurrent()`

Conflict:

- both chains can answer current stage, progress, and completion semantics
- they are not normalized into one shared projection

Runtime winner:

- modern pages trust modern chain
- legacy mission widgets trust legacy chain

### Conflict B: canonical progress vs local estimated progress

Canonical:

- `missionService.progressPercent`

Estimated:

- `workspaceHealthService.estimateJourneyProgress()`
- `useActivation().progressPercent`
- revenue journey progress

Conflict:

- admin, activation, and revenue-adjacent surfaces can display percentages that are not canonical mission percent

Runtime winner:

- each surface trusts its own local calculation

## 2. Duplicate Mission Chains

### Conflict A: dashboard mission selector vs activation day mission vs legacy current mission

Sources:

- dashboard `getCurrentMission()`
- `DAY_MISSIONS`
- `missionEngineService.getCurrentMission()`

Conflict:

- these sources answer the same user question differently:
  - what is my current mission?

Runtime winner:

- dashboard pages: dashboard `getCurrentMission()`
- activation pages: `DAY_MISSIONS`
- legacy mission surfaces: `missionEngineService.getCurrentMission()`

### Conflict B: mission state vs mission presentation

Source:

- `missionService` knows current stage and completed checks

Wrappers:

- dashboard mission selector remaps stage into dashboard mission object
- activation remaps stage into day mission object

Conflict:

- one state source produces multiple competing mission contracts

Runtime winner:

- whichever wrapper owns the current surface

## 3. Duplicate Next-Action Chains

### Conflict A: base next action vs dashboard next action vs activation next action

Sources:

- `getNextJourneyAction()`
- `useDashboardMission()`
- `useActivation()`

Conflict:

- all three answer a version of:
  - what should the user do next?

But they output different contracts:

- journey action object
- dashboard CTA + mission framing
- activation day / day mission framing

Runtime winner:

- `/journey`: base `getNextJourneyAction()`
- `/dashboard`: `useDashboardMission()`
- activation-first dashboard state: `useActivation()`

### Conflict B: page action vs AI coach recommendation

Sources:

- wrapper-selected CTA
- AI coach `getNextBestAction()` / `getAICoachAdvice()`

Conflict:

- AI coach can recommend something adjacent to, but not identical with, the current route CTA

Runtime winner:

- page CTA wins
- AI coach is explanatory/advisory only

## 4. Milestone Taxonomy Conflicts

### Conflict A: `JOURNEY_MAP` milestone model vs `missionStages.ts`

Modern:

- explicit check keys like `brand_interview`, `first_content`, `first_lead`

Legacy:

- stage progression and achievements through `missionStages.ts` and mission engine

Conflict:

- milestone completion is not expressed through one shared taxonomy

Runtime winner:

- modern pages use `completedChecks`
- legacy mission widgets use legacy stage completion and achievements

### Conflict B: canonical milestones vs activation/revenue sidecars

Sources:

- `completedChecks`
- `DAY_MISSIONS`
- revenue milestones

Conflict:

- activation and revenue layers carry milestone semantics that are not the same as canonical journey checks

Runtime winner:

- local sidecar surface wins

## 5. Read Surface Conflict Matrix

| Surface | Progression Winner | Mission Winner | Next Action Winner |
| --- | --- | --- | --- |
| `/journey` | `missionService` | none explicit | `getNextJourneyAction()` |
| `/dashboard` | `missionService` through wrappers | dashboard `getCurrentMission()` | `useDashboardMission()` |
| activation dashboard | `useActivation()` derived progress | `DAY_MISSIONS` | `useActivation()` |
| legacy mission widgets | `missionEngineService` | `missionEngineService` | legacy mission UI CTA |
| team journey reporting | journey-map helpers + `userProgress` | n/a | n/a |
| admin workspace reporting | local estimate helpers | n/a | n/a |
| AI workforce | raw `currentStageId` | n/a | stage-based agent recommendation |

## Final Conflict Judgment

There is no single runtime conflict rule for Journey Authority.

The actual conflict rule is:

`the current consumer decides which authority wins`

That means Journey today has:

- duplicate progression chains
- duplicate mission chains
- duplicate next-action chains
- duplicate milestone taxonomies

The split is not only source duplication. It is also consumer-level precedence duplication.
