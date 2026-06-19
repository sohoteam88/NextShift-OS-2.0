# Business State Conflict Report

Scope: concrete runtime conflicts where more than one authority can answer the same Business State question.

## Conflict 1: Mission Progress vs Funnel Stage

Question:

`Where is the business now?`

Conflicting authorities:

- `missionService.getState()`
- `funnelProgressService.getProgress()`

Observed conflict shape:

- mission can show user still early in journey
- funnel can show strong stage progress if content, leads, or customers already exist

Current winner:

- `/dashboard`, `/journey`, `/activation`: mission chain wins
- Funnel OS: funnel progress wins

Conflict rule today:

`No merge rule.` Each surface shows its own stage answer.

Risk:

- users can appear mid-funnel in one area and early-journey in another

## Conflict 2: `missionService` vs `missionEngineService`

Question:

`What is the current stage and mission?`

Conflicting authorities:

- `src/modules/mission/services/mission-service.ts`
- `src/modules/mission-engine/missionEngineService.ts`

Observed conflict shape:

- both read `userProgress`
- both calculate progress and mission state
- they do not use the same stage map or same response contract

Current winner:

- modern `/api/v1/mission/*` and hooks: `missionService`
- legacy `/api/mission/*` and `MissionCard`: `missionEngineService`

Conflict rule today:

`Route namespace decides the winner.`

Risk:

- duplicate stage truth
- duplicate progress semantics
- legacy UI can drift from modern mission UI

## Conflict 3: Journey Next Action vs Dashboard Mission

Question:

`What should the user do next?`

Conflicting authorities:

- `getNextJourneyAction()`
- mission-engine `getCurrentMission()`
- `useDashboardMission()` wrapper

Observed conflict shape:

- `getNextJourneyAction()` is threshold/flag based
- `getCurrentMission()` is mission-engine stage selection
- `useDashboardMission()` merges both and publishes one output

Current winner:

- dashboard-adjacent surfaces: `useDashboardMission()`
- journey page: `getNextJourneyAction()`

Conflict rule today:

`Wrapper wins if the page uses the wrapper. Otherwise raw journey action wins.`

Risk:

- dashboard can recommend different work from journey page

## Conflict 4: Activation Day vs Journey Progress

Question:

`How far along is the user?`

Conflicting authorities:

- `useActivation()`
- `useMissionState()`

Observed conflict shape:

- `useActivation()` rewrites mission state into day-based progression
- `useMissionState()` keeps stage/progress semantics

Current winner:

- activation surfaces: `useActivation()`
- mission/journey surfaces: `useMissionState()`

Conflict rule today:

`Activation UI always prefers day progression.`

Risk:

- activation day can look more mature or more linear than real mission state

## Conflict 5: CEO Health vs Funnel Health

Question:

`How healthy is the business?`

Conflicting authorities:

- `ceoAdvisorEngine.health.overallScore`
- `funnelHealthService.evaluateActivity()` / `calculate()`

Observed conflict shape:

- CEO health is business-wide weighted score
- funnel health is funnel-only operational score

Current winner:

- business-intel surfaces: CEO health
- funnel surfaces: funnel health

Conflict rule today:

`Domain scope decides the winner.`

Risk:

- a user may see strong funnel health but weak overall business health
- score numbers are not comparable

## Conflict 6: Social Readiness vs Traffic Readiness

Question:

`How ready are we to market?`

Conflicting authorities:

- `socialSetupValidator`
- `trafficEngineService.generate()` / `calculateReadiness()`

Observed conflict shape:

- social readiness measures profile completeness and visual consistency
- traffic readiness measures funnel, lead magnet, CTA, content, tracking, and thank-you readiness

Current winner:

- `/social-setup`: social readiness
- `/traffic-engine`: traffic readiness

Conflict rule today:

`Workflow scope decides the winner.`

Risk:

- both look like readiness systems but answer different questions with no shared contract

## Conflict 7: Funnel Bottleneck vs CEO Bottleneck

Question:

`What is blocking growth right now?`

Conflicting authorities:

- `funnelProgressService.bottleneck`
- `ceoAdvisorEngine.bottlenecks[]`

Observed conflict shape:

- funnel bottleneck is single operational bottleneck string
- CEO bottlenecks are multi-category strategic bottlenecks

Current winner:

- funnel surfaces: funnel bottleneck
- business-intel surfaces: CEO bottlenecks

Conflict rule today:

`Surface owner decides the winner.`

Risk:

- one surface can say “No Funnel”
- another can say “Content output low”
- both can be true but there is no priority rule between them

## Conflict 8: Traffic Recommendations vs CEO Opportunities

Question:

`What growth opportunity should be prioritized?`

Conflicting authorities:

- `trafficEngineService` generated recommendations
- `ceoAdvisorEngine.opportunities[]`

Observed conflict shape:

- traffic recommendations are campaign/readiness-oriented
- CEO opportunities are broader strategic growth suggestions

Current winner:

- traffic surfaces: traffic recommendations
- business-intel surfaces: CEO opportunities

Conflict rule today:

`Recommendation source used by the page wins.`

Risk:

- opportunity sequencing can differ across surfaces

## Unresolved Areas

### 1. No system-wide precedence contract

There is still no canonical:

- primary
- secondary
- fallback
- conflict resolver

for Business State as a whole.

### 2. Proxy semantics are treated like real facts

These proxies currently behave like authority facts:

- `progressPercent`
- `activationLevel`
- activation day
- mission stage

They are not interchangeable, but runtime surfaces often treat them as if they were.

### 3. Legacy mission chain still creates live conflict

As long as `/api/mission/*` remains live, Business State precedence stays split for mission-derived surfaces.

## Final Conflict Assessment

`Current runtime conflicts are resolved locally by surface ownership, not globally by authority law.`

That is the main precedence finding for Business State.
