# Business State Duplicate Authorities

Scope: duplicated runtime authority for diagnosis, readiness, bottlenecks, and opportunities.

## 1. Duplicate Diagnosis Authorities

| Area | Sources | Current Runtime Reality |
| --- | --- | --- |
| Funnel/business stage | `src/modules/funnel/services/funnel-progress-service.ts`, `src/app/api/v1/funnel-os/route.ts` | Funnel OS computes its own `progress`, `currentStage`, `nextStage` per funnel type. |
| Journey stage | `src/modules/mission/services/mission-service.ts`, `src/modules/mission-engine/missionEngineService.ts` | Two separate mission/journey services compute current stage and progress from `userProgress`. |
| Dashboard next-state | `src/modules/dashboard/hooks/useDashboardMission.ts`, `src/modules/journey/utils/getNextJourneyAction.ts` | Dashboard derives current business step from mission state plus boolean thresholds. |
| Activation state | `src/modules/activation/hooks/useActivation.ts`, `src/modules/activation/services/activation-service.ts` | Activation view reinterprets mission progress as day-based activation state. |
| CEO/business status | `src/modules/business-intelligence/ceoAdvisorEngine.ts` | CEO advisor computes a separate overall business status and summary from content/leads/funnels/customers and metadata flags. |

## 2. Duplicate Readiness Authorities

| Area | Sources | Current Runtime Reality |
| --- | --- | --- |
| Funnel readiness | `src/modules/funnel/services/funnel-health-service.ts`, `src/modules/funnel/services/funnel-builder-service.ts`, `src/app/api/v1/funnel-os/route.ts` | Funnel readiness exists in at least three forms: DB-backed funnel health, package health, and activity health. |
| Social readiness | `src/modules/social-setup/socialSetupValidator.ts`, `src/modules/social-setup/socialSetupService.ts`, `/api/v1/social-setup*` | Social setup has its own completeness/readiness scoring path based on profile fields. |
| Traffic readiness | `src/modules/traffic-engine/trafficGenerators.ts`, `src/modules/traffic-engine/trafficEngineService.ts` | Traffic engine computes a distinct readiness score from funnel/lead magnet/content presence. |
| Mission/journey readiness | `src/modules/mission/services/mission-service.ts`, `src/modules/mission-engine/missionEngineService.ts`, `src/modules/activation/services/activation-service.ts` | Progress percent, mission progress, activation score, and activation level all act as readiness-like signals. |
| Business readiness | `src/modules/business-intelligence/ceoAdvisorEngine.ts` | CEO advisor computes `overallScore` and per-domain health, separate from all other readiness systems. |

## 3. Duplicate Bottleneck Authorities

| Area | Sources | Current Runtime Reality |
| --- | --- | --- |
| Funnel bottlenecks | `src/modules/funnel/services/funnel-progress-service.ts` | Hard-coded bottleneck chain: content, video, funnel, webinar, leads, follow-up, upgrade. |
| CEO bottlenecks | `src/modules/business-intelligence/ceoAdvisorEngine.ts` | Separate bottleneck list for content, funnel, sales, automation. |
| UI bottleneck-like missing items | `src/modules/social-setup/socialSetupValidator.ts`, `src/modules/traffic-engine/trafficGenerators.ts` | Social and traffic modules maintain missing-items/recommendations lists that function as bottleneck signals in their own domains. |

## 4. Duplicate Opportunity Authorities

| Area | Sources | Current Runtime Reality |
| --- | --- | --- |
| Explicit opportunity list | `src/modules/business-intelligence/ceoAdvisorEngine.ts` | Only source that emits first-class `opportunities[]` with scores and explanations. |
| Funnel next action | `src/modules/funnel/services/funnel-health-service.ts`, `src/app/api/v1/funnel-os/route.ts` | Funnel health and Funnel OS both emit next actions that act as opportunity selection. |
| Journey next action | `src/modules/journey/utils/getNextJourneyAction.ts` | Journey helper emits the next recommended business action and CTA route. |
| Mission selection | `src/modules/mission-engine/services/mission-service.ts`, `src/modules/dashboard/hooks/useDashboardMission.ts` | Mission stage and task selection act as opportunity/priority selection for dashboard and downstream modules. |

## 5. Precedence Findings

### Diagnosis precedence

No system-wide precedence exists.

Current winner depends on surface:

- Funnel OS pages: funnel progress path wins
- Dashboard / Journey / Activation: mission + journey helpers win
- CEO / business-intelligence surfaces: CEO advisor wins
- Legacy `/api/mission/*` surfaces: mission engine wins

### Readiness precedence

No system-wide precedence exists.

Current winner depends on domain:

- Funnel pages use funnel health
- Social pages use social readiness
- Traffic pages use traffic readiness
- Dashboard uses mission progress / activation / mission stage
- CEO views use business health

### Bottleneck precedence

No canonical precedence exists.

- Funnel surfaces show funnel-progress bottlenecks
- CEO advisor shows business-intelligence bottlenecks
- social/traffic surfaces show local missing-item lists

### Opportunity precedence

No canonical precedence exists.

- CEO advisor owns explicit scored opportunities
- Dashboard/Journey own mission-style next actions
- Funnel OS owns funnel next actions

## 6. Summary Verdict

`NO CANONICAL BUSINESS STATE AUTHORITY`

Business State is currently split across:

- funnel progress/health
- mission and mission-engine progression
- journey helper next-action logic
- activation scoring
- social setup readiness
- traffic readiness
- CEO/business-intelligence scoring
