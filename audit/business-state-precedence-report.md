# Business State Precedence Report

Scope: current runtime precedence rules for `stage`, `readiness`, `bottlenecks`, and `opportunities`.

## Global Finding

`There is no single global Business State precedence chain in the current runtime.`

Current precedence is chosen by surface. Each major route or dashboard picks its own winner.

## Stage Precedence

Target authorities audited:

- `funnelProgressService`
- `missionService`
- `missionEngineService`
- `useActivation`
- `getNextJourneyAction`

### Current Runtime Rule

| Surface | Primary | Secondary | Fallback | Conflict Rule |
| --- | --- | --- | --- | --- |
| `/dashboard` | `useDashboardMission()` | `useMissionState()` | `useEvolutionProjection()` default snapshot | `useDashboardMission()` converts mission state + next-action thresholds into one output and wins the page |
| `/journey` | `useMissionState()` | `getNextJourneyAction()` | hardcoded progress thresholds inside page | mission `completedChecks` and `progressPercent` feed `getNextJourneyAction()`; resulting action wins CTA rendering |
| Activation | `useActivation()` | `useMissionState()` | `getActivationLevel()` derived from activation score | `useActivation()` rewrites mission progress into activation day/level and wins the activation UI |
| Funnel OS | `funnelProgressService.getProgress()` | KPI counts from route aggregate | none | funnel progress is independent of mission state and wins funnel stage display |
| Legacy mission UI | `missionEngineService.getCurrentMission()` / `getMissionProgress()` | `userProgress.currentStageId` | none | legacy route chain wins its own surfaces even if it disagrees with `missionService` |

### Strongest Authority Chain For Stage

By surface:

- Dashboard / Journey: `missionService.getState() -> useMissionState() -> getNextJourneyAction() / useDashboardMission()`
- Activation: `missionService.getState() -> useMissionState() -> useActivation()`
- Funnel: `funnelProgressService.getProgress() -> /api/v1/funnel-os`
- Legacy mission: `missionEngineService -> /api/mission/current`

### Current Winner

`Stage has no single winner.`

Current runtime winners are:

- Dashboard / Journey winner: `missionService` mediated by `getNextJourneyAction()`
- Activation winner: `useActivation()`
- Funnel winner: `funnelProgressService`
- Legacy mission winner: `missionEngineService`

## Readiness Precedence

Target authorities audited:

- `funnelHealthService`
- `socialSetupValidator`
- `trafficEngineService`
- `activationLevel`
- CEO health

### Current Runtime Rule

| Surface | Primary | Secondary | Fallback | Conflict Rule |
| --- | --- | --- | --- | --- |
| Funnel OS | `funnelHealthService.evaluateActivity()` | route KPI math | none | funnel health wins funnel readiness regardless of traffic/social/mission scores |
| Funnel Builder | `funnelHealthService.evaluatePackage()` | package advisor | none | package health score wins |
| Social Setup | `socialSetupService.getReadiness()` -> `validateSocialSetup()` | generated setup completeness | empty setup defaults | social readiness wins that page |
| Traffic Engine | `trafficEngineService.generate()` -> `calculateReadiness()` | persisted `traffic_engine` metadata | no-package state | traffic readiness wins that page |
| Activation | `useActivation().activationLevel` | `progressPercent` from mission state | `explorer`-like low score | activation level wins activation UI |
| CEO / Business Intel | `ceoAdvisorEngine.generateCEOReport().health` | raw module counts and metadata flags | none | CEO health wins business-intel surfaces |
| Dashboard | `useDashboardMission().progress` | `useActivation().activationLevel` | evolution snapshot progress | dashboard treats mission progress as readiness proxy; no dedicated health score wins |

### Strongest Authority Chain For Readiness

By surface:

- Funnel readiness: `funnelHealthService`
- Social readiness: `socialSetupValidator`
- Traffic readiness: `trafficEngineService`
- Activation readiness: `useActivation()`
- CEO readiness: `ceoAdvisorEngine`
- Dashboard readiness proxy: `missionService.getState()`

### Current Winner

`Readiness has no single winner.`

The strongest explicit readiness authority is surface-specific:

- Funnel: `funnelHealthService`
- Social: `socialSetupValidator`
- Traffic: `trafficEngineService`
- Activation: `activationLevel`
- CEO / analytics: `ceoAdvisorEngine.health.overallScore`
- Dashboard: `progressPercent` proxy from `missionService`

## Bottleneck Precedence

Target authorities audited:

- funnel bottlenecks
- CEO bottlenecks
- social missing items
- traffic missing items

### Current Runtime Rule

| Surface | Primary | Secondary | Fallback | Conflict Rule |
| --- | --- | --- | --- | --- |
| Funnel OS | `funnelProgressService.bottleneck` | `bottleneckFix` | none | funnel bottleneck string wins funnel UI |
| CEO / Business Intel | `ceoAdvisorEngine.bottlenecks[]` | health recommendations | none | CEO bottlenecks win business-intel UI |
| Social Setup | `validateSocialSetup()` completeness gaps | advisor tips | empty setup defaults | missing fields become effective bottleneck |
| Traffic Engine | `generateTrafficPackage().readiness` missing-item signals | advisor tips | no-package state | readiness gaps and checklist items win |

### Strongest Authority Chain For Bottlenecks

By surface:

- Funnel bottleneck chain: `funnelProgressService -> /api/v1/funnel-os`
- CEO bottleneck chain: `ceoAdvisorEngine -> /api/v1/business-intel`
- Social bottleneck chain: `validateSocialSetup() -> socialSetupService.getReadiness()`
- Traffic bottleneck chain: `calculateReadiness() -> trafficEngineService.generate()`

### Current Winner

`Bottlenecks also have no single winner.`

The winner is whichever surface owns the current workflow.

## Opportunity Precedence

Target authorities audited:

- CEO opportunities
- funnel next actions
- mission selection
- journey next action
- dashboard mission

### Current Runtime Rule

| Surface | Primary | Secondary | Fallback | Conflict Rule |
| --- | --- | --- | --- | --- |
| Dashboard | `useDashboardMission().mission` | `useDashboardMission().nextAction` | AI coach message from mission id | dashboard mission wrapper wins |
| Journey | `getNextJourneyAction()` | `useMissionState().completedChecks` and `progressPercent` | threshold inference | next journey action wins CTA |
| Activation | `useActivation().dayMission` | `getNextJourneyAction()` | activation day lookup | day mission wins |
| Funnel OS | `funnelHealthService.getActivityNextAction()` | funnel health / progress counts | none | funnel next action wins |
| Funnel Builder | `funnelHealthService.getPackageAdvisor()` | `evaluatePackage()` score | none | package advisor wins |
| CEO / Business Intel | `ceoAdvisorEngine.opportunities[]` and `actions[]` | health recommendations | default “继续完善品牌基础” action | CEO opportunities win business-intel surfaces |
| Legacy mission UI | `missionEngineService.getCurrentMission()` | `getMissionProgress()` | none | legacy mission selection wins |

### Strongest Authority Chain For Opportunities

By surface:

- Dashboard mission chain: `missionService.getState() -> getNextJourneyAction() + mission-engine getCurrentMission() -> useDashboardMission()`
- Journey chain: `missionService.getState() -> getNextJourneyAction()`
- Funnel chain: `funnelHealthService.getActivityNextAction()`
- CEO chain: `ceoAdvisorEngine.opportunities/actions`
- Legacy mission chain: `missionEngineService`

### Current Winner

`Opportunities do not have one winner either.`

The most powerful current opportunity wrapper is `useDashboardMission()`, but it only wins dashboard-adjacent surfaces. It does not override Funnel or CEO surfaces.

## Summary Matrix

| Projection | Primary | Secondary | Fallback | Conflict Rule |
| --- | --- | --- | --- | --- |
| `stage` | surface-specific | surface-specific | thresholds / defaults | winner is chosen by page or route, not system-wide |
| `readiness` | surface-specific | module-specific scores or proxies | defaults / persisted package state | winner is whichever readiness engine the surface calls |
| `bottlenecks` | surface-specific | recommendations or missing items | none | winner is whichever workflow surface owns the user context |
| `opportunities` | surface-specific | next-action helpers | defaults | winner is whichever orchestration wrapper the surface uses |

## Final Precedence Assessment

`Current Business State precedence is surface-local, not canonical.`

The repo today does not implement:

- one primary
- one secondary
- one fallback
- one conflict rule

for the whole system. It implements separate local precedence chains per product surface.
