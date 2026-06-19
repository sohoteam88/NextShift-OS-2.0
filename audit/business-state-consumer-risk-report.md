# Business State Consumer Risk Report

Status: P2-003 consumer audit
Authority: Business State
Runtime changes: none.

## Risk Classification

Low risk means read-only display or read-only route consumers with no next-action ownership.
Medium risk means readiness consumers with user-facing impact but no primary dashboard or next-action ownership.
High risk means consumers that choose stage, choose next action, choose recommendations, or drive dashboard behavior.

## Blocked Consumers

These must remain blocked until later wave approval:

| Consumer | Files | Reason |
| --- | --- | --- |
| DashboardV4 | `src/modules/dashboard/components/DashboardV4.tsx`, `src/modules/dashboard/hooks/useDashboardMission.ts` | Dashboard behavior depends on mission progress, activation state, evolution projection, current mission, and next action. |
| Journey | `src/app/(auth)/journey/page.tsx`, `src/modules/journey/utils/getNextJourneyAction.ts` | Journey currently infers stage and next action locally from completed checks and percentage thresholds. |
| AI COO / Advisor | `src/app/api/v1/business-intel/route.ts`, `src/modules/business-intelligence/ceoAdvisorEngine.ts`, AI agent files | Advisor creates health, bottlenecks, opportunities, risks, and recommendations; it is not just a consumer. |
| Growth Loop | `src/app/(auth)/team/growth/page.tsx` and team/growth surfaces | Growth Loop should consume only approved Business State signals in a later wave. |
| Activation | `src/modules/activation/hooks/useActivation.ts`, `src/modules/activation/components/ActivationDashboard.tsx` | Activation computes score, level, day mission, and progress from mission state. |

## High-Risk Consumers

### `useDashboardMission()`

Risk: High

- Reads mission state, evolution projection, quick stats, journey next-action logic, mission-engine current mission, and AI coach advice.
- Chooses current mission and next action itself.
- Feeds `DashboardV4`, content, lead, and CRM dashboards.
- Not eligible for P2 bounded cutover.

### `DashboardV4`

Risk: High

- Primary authenticated dashboard surface.
- Uses `useDashboardMission()` and `ActivationDashboard`.
- Any stage/readiness migration could change the main user task routing.
- Not eligible for P2 bounded cutover.

### Journey page and `getNextJourneyAction()`

Risk: High

- Journey page maps `completedChecks` plus `progressPercent` cutoffs into next action state.
- `getNextJourneyAction()` is an authority-like selector for stage and opportunity.
- Not eligible for P2 bounded cutover.

### Activation hook/dashboard

Risk: High

- Computes current day, activation score, activation level, and current day mission.
- Blends readiness proxy and stage proxy.
- Not eligible for P2 bounded cutover.

### Funnel OS route and card

Risk: High

- `/api/v1/funnel-os` aggregates `funnelProgressService`, `funnelHealthService`, and counts into progress, health, milestones, KPI, and next action.
- `FunnelOperatingCard` displays those decisions.
- Route-level migration must be planned separately before UI consumption.

### CEO Advisor / Business Intel

Risk: High

- `ceoAdvisorEngine` creates advisory readiness, bottlenecks, opportunities, risks, and actions.
- Business State may accept advisory bottlenecks/opportunities, but factual readiness must not be overridden by advisor output.
- Blocked until AI/Advisor migration wave.

### Social Setup Wizard

Risk: High

- Workflow UI consumes readiness, missing setup state, generated setup output, and tips.
- Route read path may be a candidate, but the dashboard workflow is not.

### Traffic Dashboard

Risk: High

- Workflow UI consumes score, readiness level, missing items, and generated strategy recommendations.
- Generation route can also notify mission progress, so it is not a read-only cutover.

### Legacy Mission Routes

Risk: High

- Legacy `/api/mission/*` routes remain runtime-accessible and use `missionEngineService`.
- They overlap with active mission state but are not the same source path.
- Do not change under P2-003.

## Medium-Risk Consumers

| Consumer | Risk Reason |
| --- | --- |
| `FunnelBuilderDashboard` | User-facing package readiness and package advisor display. |
| `funnel-builder-service` | Uses health/advisor logic and writes derived package advisor fields. |
| `useFunnelOS()` | Indirect aggregate reader; safer than route but still bound to a high-risk route contract. |
| `EvolutionAdapter` | Projection infrastructure reads mission state; migration could affect another authority system. |
| `ContentCommandCenter`, `LeadDashboard`, `CRMDashboard` | Indirect consumers of `useDashboardMission`; risk inherited from dashboard hook. |
| `traffic-strategist`, `ceo-advisor`, `brand-strategist` agents | AI consumers whose semantics depend on readiness and recommendation definitions. |

## Low-Risk Consumers

| Consumer | Why Low Risk | Candidate |
| --- | --- | --- |
| `/api/v1/funnel/funnels/[id]/health` | Read-only route around `funnelHealthService.calculate`; no dashboard selector ownership. | Yes |
| GET `/api/v1/social-setup` | Read-only route returns setup and readiness; PUT remains excluded. | Yes |
| GET `/api/v1/traffic-engine` | Read-only route around persisted traffic readiness. | Yes |

## Early Cutover Candidates

Only these are eligible for a bounded cutover plan:

1. `src/app/api/v1/funnel/funnels/[id]/health/route.ts`
2. GET side of `src/app/api/v1/social-setup/route.ts`
3. `src/app/api/v1/traffic-engine/route.ts`

Constraints for P2-004:

- Do not import `BusinessStateService` into dashboards.
- Do not change `getNextJourneyAction`.
- Do not change mission write routes.
- Do not change generation routes.
- Preserve existing route response shapes or use additive fields only.
- Treat CEO Advisor readiness as advisory, not factual.

## Main Migration Hazards

1. Dashboard and Journey already choose stage/next action locally.
2. Readiness is not a single concept today: mission progress, activation score, funnel health, social readiness, traffic readiness, and CEO health all coexist.
3. Bottleneck and opportunity payloads are heterogeneous strings, checklists, advisor objects, route next actions, and generated recommendations.
4. Several consumers are write paths or generation paths; these must not be treated as simple read consumers.
5. Legacy mission routes remain live enough to require explicit retirement sequencing later.
