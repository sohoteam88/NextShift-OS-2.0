# Business State Read / Write Authority Map

Scope: current runtime read paths, write paths, strongest authority chain, and effective ownership for Business State-relevant sources.

## Stage Authorities

| Source | Reads From | Writes To | Primary Consumers | Effective Ownership | Notes |
| --- | --- | --- | --- | --- | --- |
| `missionService.getState()` | `prisma.userProgress`, journey map helpers | `completeCheck()`, `setMode()`, `skipStage()` update `userProgress` | `/api/v1/mission/state`, `/journey`, `useDashboardMission()`, `useActivation()`, `EvolutionAdapter` | Modern mission chain | strongest active persisted stage authority for dashboard/journey surfaces |
| `missionEngineService` | `prisma.userProgress`, legacy `missionStages` helpers | `completeCurrentMission()`, `setMode()` update `userProgress` and mission records | legacy `/api/mission/*`, `MissionCard` | Legacy mission chain | duplicate persisted stage authority |
| `funnelProgressService` | Prisma counts + `user.metadata` module flags | none direct; derived from other modules writing metadata or records | `/api/v1/funnel-os`, Funnel OS UI | Funnel chain | read-only projection from funnel/module state |
| `useActivation()` | `useMissionState()` + activation helper math | none | `ActivationDashboard`, `DashboardV4` | Activation chain | derived read model only |
| `getNextJourneyAction()` | boolean flags / thresholds from mission state | none | `/journey`, `useDashboardMission()`, `useActivation()` | Journey CTA chain | derived next-step logic, not persistence authority |

## Readiness Authorities

| Source | Reads From | Writes To | Primary Consumers | Effective Ownership | Notes |
| --- | --- | --- | --- | --- | --- |
| `funnelHealthService` | Prisma funnel counts/config, funnel package structure | none | `/api/v1/funnel-os`, `/api/v1/funnel/funnels/[id]/health`, Funnel Builder | Funnel health chain | explicit funnel readiness authority |
| `socialSetupValidator` via `socialSetupService.getReadiness()` | `user.metadata.social_setup` | `socialSetupService.generateSetup()` / `saveSetup()` write `metadata.social_setup` | `/api/v1/social-setup*`, `SocialSetupWizard` | Social setup chain | explicit social readiness authority |
| `trafficEngineService.generate()` / `calculateReadiness()` | Brand context, DB counts, `user.metadata` module flags | `trafficEngineService.save()` writes `metadata.traffic_engine` | `/api/v1/traffic-engine*`, `TrafficDashboard`, traffic AI | Traffic chain | explicit traffic readiness authority |
| `getActivationLevel()` / `useActivation()` | mission-derived progress | none | activation surfaces, dashboard shortcut | Activation chain | readiness proxy only |
| `ceoAdvisorEngine.health` | Prisma counts, brand context, `user.metadata` module flags | none | `/api/v1/business-intel`, `CEOAdvisorDashboard`, AI agents | CEO / Business Intel chain | broad business readiness authority |

## Bottleneck Authorities

| Source | Reads From | Writes To | Primary Consumers | Effective Ownership | Notes |
| --- | --- | --- | --- | --- | --- |
| `funnelProgressService.bottleneck` | DB counts + `user.metadata` module flags | none | Funnel OS | Funnel chain | single operational bottleneck plus fix |
| `ceoAdvisorEngine.bottlenecks[]` | DB counts + brand context + metadata flags | none | Business Intel / CEO | CEO chain | strategic multi-category bottlenecks |
| `validateSocialSetup()` missing completeness | `metadata.social_setup` | social setup writes update the underlying metadata | Social Setup | Social chain | bottleneck represented as missing setup fields |
| `trafficEngineService` readiness gaps | generated package readiness inputs | save persists full traffic package to metadata | Traffic Engine | Traffic chain | bottleneck represented as missing items / weak readiness areas |

## Opportunity Authorities

| Source | Reads From | Writes To | Primary Consumers | Effective Ownership | Notes |
| --- | --- | --- | --- | --- | --- |
| `getNextJourneyAction()` | mission completion booleans and threshold inference | none | `/journey`, `useDashboardMission()`, `useActivation()` | Journey chain | derived CTA authority |
| mission-engine `getCurrentMission()` | level + milestone booleans | none | `useDashboardMission()` | Dashboard mission chain | derived mission selection |
| `useDashboardMission()` | `useMissionState()`, `getNextJourneyAction()`, mission-engine mission selection | none | `DashboardV4`, Content/Lead/CRM mission panels | Dashboard chain | strongest dashboard opportunity wrapper |
| `funnelHealthService.getActivityNextAction()` | funnel activity counts | none | `/api/v1/funnel-os` -> Funnel OS | Funnel chain | explicit funnel opportunity authority |
| `funnelHealthService.getPackageAdvisor()` | package health score | none | Funnel Builder | Funnel Builder chain | package-specific opportunity authority |
| `ceoAdvisorEngine.opportunities[]` / `actions[]` | advisor health + opportunity ranking | none | Business Intel / CEO surfaces | CEO chain | strategic opportunity authority |
| `trafficEngineService` generated recommendations | traffic readiness package | `save()` persists package | Traffic Engine | Traffic chain | channel-level opportunity guidance |

## Strongest Authority Chains

### Stage

- Modern dashboard/journey stage chain:
  `userProgress -> missionService.getState() -> /api/v1/mission/state -> useMissionState() -> getNextJourneyAction()/useDashboardMission()/useActivation()`
- Funnel stage chain:
  `DB counts + metadata flags -> funnelProgressService.getProgress() -> /api/v1/funnel-os`
- Legacy stage chain:
  `userProgress -> missionEngineService -> /api/mission/current`

### Readiness

- Funnel readiness:
  `DB counts/config -> funnelHealthService`
- Social readiness:
  `metadata.social_setup -> validateSocialSetup()`
- Traffic readiness:
  `BrandContext + DB counts + metadata -> calculateReadiness() -> trafficEngineService.save(metadata.traffic_engine)`
- CEO readiness:
  `BrandContext + DB counts + metadata -> ceoAdvisorEngine.health`

### Bottlenecks

- Funnel:
  `DB counts + metadata -> funnelProgressService.bottleneck`
- CEO:
  `advisor engine -> bottlenecks[]`
- Social:
  `validateSocialSetup() -> completeness gaps`
- Traffic:
  `generateTrafficPackage() -> readiness gaps`

### Opportunities

- Dashboard:
  `missionService.getState() + getNextJourneyAction() + getCurrentMission() -> useDashboardMission()`
- Journey:
  `missionService.getState() -> getNextJourneyAction()`
- Funnel:
  `funnelHealthService.getActivityNextAction()`
- CEO:
  `ceoAdvisorEngine.opportunities/actions`

## Effective Read / Write Winners

| Projection | Strongest Read Chain | Strongest Write Chain | Current Winner |
| --- | --- | --- | --- |
| `stage` | `missionService` for dashboard/journey, `funnelProgressService` for funnel, `missionEngineService` for legacy | `missionService.completeCheck()` and `missionEngineService.completeCurrentMission()` both write `userProgress` | Split |
| `readiness` | domain-specific readiness engines | `socialSetupService.saveSetup()` and `trafficEngineService.save()` persist readiness-related state; funnel and CEO are read-only derived | Split |
| `bottleneck` | domain-specific derived read models | no dedicated bottleneck persistence | Split |
| `opportunity` | page-specific orchestration wrappers | no dedicated opportunity persistence | Split |

## Final Read / Write Assessment

`Business State has read chains, but not one read authority.`

It also has some write paths, but only for subdomains:

- mission writes `userProgress`
- social setup writes `metadata.social_setup`
- traffic engine writes `metadata.traffic_engine`

Funnel health, funnel bottlenecks, CEO health, CEO bottlenecks, and most opportunity outputs are read-only derived authorities today.
