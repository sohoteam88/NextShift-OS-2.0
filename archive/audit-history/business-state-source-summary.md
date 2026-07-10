# Business State Source Summary

Scope: factual summary of current runtime sources that answer:

- where is this business now
- how ready is it
- what is the bottleneck
- what is the opportunity

## Source Counts

| Authority Role | Active Sources | Notes |
| --- | --- | --- |
| Diagnosis | 8 | Funnel, mission, mission-engine, dashboard, journey, activation, CEO advisor |
| Readiness | 9 | Funnel health, social setup, traffic, mission progress, activation, CEO health |
| Bottleneck | 4 | Funnel progress, CEO advisor, social missing-items, traffic missing-items |
| Opportunity | 5 | CEO opportunities, funnel next actions, journey next action, mission stage, dashboard mission |

## Current Runtime Winners By Surface

| Surface | Effective Source | What It Decides |
| --- | --- | --- |
| Funnel OS | `funnelProgressService` + `funnelHealthService` via `/api/v1/funnel-os` | funnel progress, health, bottleneck, next action |
| Funnel Builder | `funnelHealthService.evaluatePackage()` | package health score and package next action |
| CEO / Business Intel | `ceoAdvisorEngine.generateCEOReport()` | overall business health, bottlenecks, opportunities, actions |
| Social Setup | `validateSocialSetup()` via `socialSetupService.getReadiness()` | profile/setup readiness and missing items |
| Traffic Engine | `calculateReadiness()` via `trafficEngineService.generate()` | campaign readiness, missing items, recommendations |
| Dashboard | `useDashboardMission()` | current mission, next action, progress stage, AI coach payload |
| Journey | `getNextJourneyAction()` + mission state inputs | next business step and CTA |
| Activation | `useActivation()` + activation helpers | activation day, score, level, progress |
| `/api/v1/mission/state` | `missionService.getState()` | journey progress percent, current/next stage, ETA |
| Legacy `/api/mission/current` | `missionEngineService.getCurrentMission()` / `getMissionProgress()` | legacy mission state and progress |

## Projection Mapping To `BusinessState`

| Source | `stage` | `readiness` | `bottlenecks` | `opportunities` |
| --- | --- | --- | --- | --- |
| `funnelProgressService` | Yes | Partial | Yes | No |
| `funnelHealthService` | No | Yes | Partial | Partial |
| Funnel OS route aggregate | Yes | Yes | Yes | Partial |
| `ceoAdvisorEngine` | Partial | Yes | Yes | Yes |
| `validateSocialSetup` | No | Yes | Partial | No |
| `socialSetupService.getReadiness` | No | Yes | Partial | No |
| `calculateReadiness` | No | Yes | Partial | No |
| `trafficEngineService.generate` | No | Yes | Partial | No |
| `missionService.getState` | Yes | Partial | No | No |
| `getCurrentMission` (`mission-engine/services/mission-service.ts`) | Yes | Partial | No | Partial |
| `missionEngineService` | Yes | Partial | No | No |
| `getNextJourneyAction` | Yes | No | No | Yes |
| activation helpers + `useActivation` | Yes | Partial | No | No |
| `useDashboardMission` | Yes | Partial | No | Yes |

## Main Duplicate Authority Zones

### 1. Progress / Stage

Current runtime has multiple independent stage or progress engines:

- funnel stage progress
- mission progress
- mission-engine progress
- journey next-step thresholds
- activation day progression

### 2. Readiness

Current runtime has multiple independent readiness engines:

- funnel health
- social readiness
- traffic readiness
- activation level
- mission progress percent
- CEO health score

### 3. Bottlenecks

Current runtime has at least three bottleneck-like systems:

- funnel bottleneck chain
- CEO advisor bottleneck list
- social/traffic missing-item systems

### 4. Opportunities / Next Best Action

Current runtime has multiple ways to answer “what should happen next”:

- CEO advisor `opportunities[]`
- funnel next action
- journey next action
- mission selection
- dashboard mission wrapper

## Final Source Assessment

`Business State is currently a split runtime concern, not a single authority.`

The repo today does not have one Business State source. It has multiple active domain-specific sources, and each major surface chooses its own winner.
