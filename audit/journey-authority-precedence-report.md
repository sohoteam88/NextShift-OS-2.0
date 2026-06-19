# Journey Authority Precedence Report

Scope: current runtime precedence only.

The main result is:

`Journey Authority does not have one global precedence chain today.`

Precedence is decided per projection and per surface.

## 1. Progression

### Primary Source

`missionService`

Why:

- modern `/api/v1/mission/state`
- modern `/api/v1/mission/journey`
- `useMissionState()`
- `/journey`
- most mixed dashboard wrappers start from this state

### Secondary Source

`missionEngineService`

Why:

- legacy `/api/mission/current`
- legacy `MissionCard`
- legacy dashboard mission widgets

### Fallback Source

Surface-local derived progression:

- `useActivation()` using `getNextJourneyAction()`
- `workspaceHealthService.estimateJourneyProgress()`
- `revenue-journey-service`

Why:

- these surfaces still render progress even when they are not consuming canonical journey percent directly

### Conflict Rule

There is no cross-runtime reconciliation.

Current runtime rule is:

- modern surfaces trust `missionService`
- legacy mission surfaces trust `missionEngineService`
- derived reporting or activation surfaces trust their own wrapper math

So if two progression values disagree, the winner is whichever source the current consumer already reads.

## 2. Milestones

### Primary Source

`JOURNEY_MAP` semantics as materialized through `missionService.completedChecks`

Why:

- `missionService` writes and reads `completedChecks`
- modern progression and journey map use `completedChecks` against `JOURNEY_MAP`

### Secondary Source

`missionStages.ts` plus legacy mission-engine achievements/progress

Why:

- legacy mission widgets and routes still expose achievements and stage completion from the old chain

### Fallback Source

Derived milestone systems:

- activation success events through `DAY_MISSIONS`
- revenue milestones in `revenue-journey-service`

Why:

- these surfaces carry their own milestone semantics when not rendering canonical `completedChecks`

### Conflict Rule

Milestone truth is also surface-local:

- modern mission surfaces use `completedChecks`
- legacy mission surfaces use legacy stage/achievement semantics
- activation and revenue surfaces use their own milestone sets

No shared runtime rule resolves milestone disagreement globally.

## 3. Missions

### Primary Source

No single global primary exists.

Current surface winners are:

- dashboard and downstream dashboards: dashboard `getCurrentMission()`
- activation surfaces: `DAY_MISSIONS`
- legacy mission widgets and routes: `missionEngineService.getCurrentMission()`

### Secondary Source

`missionService` stage state

Why:

- mission selection wrappers derive missions from canonical progress
- but `missionService` itself does not currently expose the final dashboard mission contract directly

### Fallback Source

Static or wrapper-level mission mappings:

- dashboard mission selector in `src/modules/mission-engine/services/mission-service.ts`
- activation `DAY_MISSIONS`
- legacy `missionEngineService`

### Conflict Rule

Mission precedence is the most fragmented projection in Journey.

Current runtime rule is:

- dashboard trusts the dashboard mission selector
- activation trusts `DAY_MISSIONS`
- legacy mission UI trusts `missionEngineService`

If those missions disagree, the user sees whichever mission model belongs to the page they are on.

## 4. Next Actions

### Primary Source

`getNextJourneyAction()`

Why:

- `/journey`
- `useDashboardMission()`
- `useActivation()`

all start next-step derivation from this helper

### Secondary Source

Wrapper-level next-action overlays:

- `useDashboardMission()`
- `useActivation()`

Why:

- they take the base next action and reinterpret it into dashboard CTA or activation day semantics

### Fallback Source

Advisory next-action copy:

- AI Coach `getNextBestAction()`
- AI coach advice inside `useDashboardMission()`

Why:

- these provide narrative action guidance when a wrapper already chose the page-level action

### Conflict Rule

Current runtime precedence is:

1. page or wrapper action model
2. base `getNextJourneyAction()`
3. AI coach recommendation copy

That means AI coach does not win route authority. It only decorates or explains a route already chosen by a wrapper or page.

## Final Precedence Judgment

By projection:

| Projection | Effective Winner |
| --- | --- |
| Progression | `missionService` on modern surfaces, `missionEngineService` on legacy surfaces, local heuristics on reporting/activation sidecars |
| Milestones | `completedChecks` + `JOURNEY_MAP` on modern surfaces, legacy stage/achievement semantics on old surfaces, local milestone sets on activation/revenue |
| Missions | no global winner; dashboard mission selector, `DAY_MISSIONS`, and `missionEngineService` all win on different surfaces |
| Next Actions | `getNextJourneyAction()` is the strongest base resolver, but wrappers still own final rendered action on their own surfaces |

So the real runtime answer is:

`precedence is surface-based, not system-based`
