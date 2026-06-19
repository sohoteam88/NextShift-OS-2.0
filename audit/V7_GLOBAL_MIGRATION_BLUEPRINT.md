# V7 Global Migration Blueprint

Status: Architecture Planning

Scope: convert completed V7 Authority Discovery into one unified migration program.

This document is architecture-level only. It does not define implementation code, schema changes, or UI changes.

Reviewed readiness layers:

- Interview Authority: `READY WITH CONDITIONS`
- Business State: `READY WITH CONDITIONS`
- Journey: `READY WITH CONDITIONS`
- AI COO: `READY WITH CONDITIONS`
- Agent Runtime: `READY WITH CONDITIONS`
- Growth Loop: `READY WITH CONDITIONS`

## Executive Decision

V7 migration planning may begin.

The migration must be:

- adapter-first
- wave-based
- projection-led before consumer cutover
- read-contract-first before write-contract changes
- retirement-last

No layer is currently clean enough for direct replacement. Every layer has enough discovery evidence to plan, but each layer still contains live legacy authorities, local winner selection, or mixed consumers.

Canonical authority chain:

```text
Interview Authority
  -> Business State
  -> Journey
  -> AI COO
  -> Agent Runtime
  -> Growth Loop
```

## 1. Authority Dependency Graph

### 1.1 Layer Dependencies

```text
Layer 1: Interview Authority
  owns raw identity, audience, profile, context, and interview-derived business inputs
  feeds:
    Business State
    Journey
    AI COO
    Growth Loop acquisition/positioning signals

Layer 2: Business State
  owns normalized stage, readiness, bottlenecks, and opportunities
  reads:
    Interview Authority
    mission/funnel/social/traffic/CEO sources through adapters
  feeds:
    Journey
    AI COO
    Growth Loop

Layer 3: Journey
  owns progression, milestones, missions, and route-level next action
  reads:
    Business State
    mission state
    journey map
  feeds:
    AI COO assignment context
    Agent Runtime stage routing
    Growth Loop activation signals

Layer 4: AI COO
  owns tactical and strategic recommendation, delegation, assignment, and routing plan
  reads:
    Interview Authority
    Business State
    Journey
    CEO Advisor
    AI Coach
    Agent Registry
  feeds:
    Agent Runtime execution plan
    Growth Loop recommendation inputs

Layer 5: Agent Runtime
  owns agent execution, routing, lifecycle, memory, and tool execution result contracts
  reads:
    AI COO assignment/delegation plan
    Agent Registry
    agentManager
    workforce orchestrator
    executor modules
  feeds:
    Growth Loop execution outcomes and operational actions

Layer 6: Growth Loop
  owns normalized growth read projection across acquisition, activation, retention, referral, and expansion
  reads:
    Interview Authority
    Business State
    Journey
    AI COO recommendations
    Agent Runtime outcomes
    domain writers and platform aggregates
  feeds:
    dashboards
    reporting
    AI recommendations
    platform/team/franchise growth views
```

### 1.2 Global Read Paths

| Layer | Primary Read Path | Transitional Read Path | Risk |
| --- | --- | --- | --- |
| Interview Authority | `BrandInterview` / `BrandProfile` -> profile/audience/context snapshots | `metadata.brand_profile`, onboarding metadata, page-local merges | legacy metadata can still win locally |
| Business State | normalized stage/readiness/bottleneck/opportunity projection | funnel progress/health, mission, social, traffic, CEO wrappers | readiness and opportunity semantics differ by surface |
| Journey | `missionService` + `JOURNEY_MAP` + next-action resolver | activation, dashboard, mission-engine, revenue sidecars | dashboard/activation wrappers reinterpret journey |
| AI COO | tactical/strategic COO plan adapters | AI coach route, CEO Advisor, workforce orchestrator, legacy dashboard panel | recommendation and assignment taxonomy split |
| Agent Runtime | runtime execution/lifecycle/memory projection | `agentManager`, `ai-workforce` routes, `agentMemoryService`, executors | execute route is branch-based; memory is metadata-backed |
| Growth Loop | normalized growth projection by domain and scope | funnel/lead/content/mission/followup/invite/platform/team/franchise/AI sources | surface-local precedence and mixed dashboards |

### 1.3 Global Write Paths

| Layer | Current Write Authority | Migration Rule |
| --- | --- | --- |
| Interview Authority | `BrandInterview.answers`, confirmed `BrandProfile`, legacy metadata paths | preserve raw capture and confirmed profile writes; retire legacy metadata writes only after adapters and consumers move |
| Business State | no single canonical writer; uses domain writers and derived services | treat Business State as read projection first |
| Journey | `missionService` / mission progress paths; legacy mission chain still live | preserve modern mission writes; bridge legacy writes until consumers are migrated |
| AI COO | no durable canonical COO plan writer | introduce planning/read contract before writing durable COO state |
| Agent Runtime | `POST /api/v1/ai-workforce/execute`, `agentMemoryService`, executor modules | preserve execute behavior; wrap before changing persistence or execution selection |
| Growth Loop | domain writers: funnel, lead, content, followup, invite/register, automation, franchise metadata | Growth Loop must not replace factual domain writers during planning |

### 1.4 Adapter Requirements By Dependency

| Dependency | Required Adapter |
| --- | --- |
| Interview -> Business State | profile/audience/context snapshot adapters; onboarding metadata compatibility adapter |
| Interview -> Journey | audience/business-context adapter for journey context and mission personalization |
| Business State -> Journey | stage/readiness/opportunity to journey progression and next-action adapter |
| Journey -> AI COO | progression/milestone/next-action to assignment context adapter |
| AI COO -> Agent Runtime | COO plan to execution request adapter |
| Agent Runtime -> Growth Loop | execution result/action outcome to growth signal adapter |
| Business State -> Growth Loop | stage/readiness/bottleneck/opportunity to growth health adapter |
| Journey -> Growth Loop | progression/milestones to activation growth adapter |
| Domain Writers -> Growth Loop | acquisition, retention, referral, expansion fact adapters |

## 2. Migration Waves

### Wave 1: Interview Authority

Goal:

Establish stable identity/profile/audience/context projections without breaking live interview capture.

Scope:

- define `InterviewProfileSnapshot`
- define `AudienceSnapshot`
- define `BusinessContextSnapshot`
- preserve `BrandInterview.answers`
- preserve confirmed `BrandProfile`
- adapt legacy metadata and onboarding metadata

First-wave consumers:

- service-backed downstream readers
- bounded brand/profile readers
- low-risk legacy readers through compatibility adapter

Do not cut over yet:

- business mode
- onboarding audience side-channel writers
- surfaces with local authority merges

Exit criteria:

- profile/audience/context snapshots exist as read contracts
- compatibility adapter covers `metadata.brand_profile`
- onboarding audience/context side-channel is explicitly tracked
- business mode remains marked unresolved, not silently absorbed

### Wave 2: Business State

Goal:

Create a normalized read projection for stage, readiness, bottlenecks, and opportunities.

Scope:

- adapt `missionService` and funnel progress into stage
- adapt funnel/social/traffic/CEO readiness
- adapt funnel/CEO/social/traffic bottlenecks
- adapt journey/funnel/CEO opportunities

First-wave consumers:

- Journey
- Funnel OS
- Business Intel
- Social Setup
- Traffic Engine

Do not cut over yet:

- Dashboard
- Activation
- legacy mission chain

Exit criteria:

- `BusinessState.stage` contract exists
- `BusinessState.readiness` normalizes source and domain
- `BusinessState.bottlenecks` handles string/array/missing-item forms
- `BusinessState.opportunities` separates CTA, mission, list, and recommendation semantics

### Wave 3: Journey

Goal:

Make Journey the progression/milestone/mission/route-next-action layer over Business State.

Scope:

- adapt `missionService` to progression
- adapt `JOURNEY_MAP` and completed checks to milestones
- adapt `getNextJourneyAction()` to route next action
- bridge dashboard and activation wrappers
- bridge legacy mission chain until references are zero

First-wave consumers:

- Journey page
- journey route/API readers
- team progress reporting if read-only

Do not cut over yet:

- DashboardV4
- ActivationDashboard
- AI consumers
- revenue journey sidecar

Exit criteria:

- progression, milestones, mission, and next-action read contracts exist
- legacy `missionEngineService` and `missionStages.ts` are isolated behind bridge
- dashboard and activation wrappers consume adapters instead of choosing independent truth

### Wave 4: AI COO

Goal:

Create one COO planning layer for recommendation, delegation, assignment, and routing.

Scope:

- adapt AI Coach tactical recommendation
- adapt CEO Advisor strategic recommendation
- adapt agent registry and agent manager for assignment
- adapt workforce orchestrator for delegation
- separate product CTA routing from backend execution routing

First-wave consumers:

- AI Coach
- CEO Mode through adapter
- Workforce Dashboard planning view

Do not cut over yet:

- Dashboard AI surfaces
- `AiRecommendationPanel`
- `/api/v1/ai-workforce/execute` branch behavior

Exit criteria:

- tactical vs strategic recommendation collapse rule is defined
- assignment contract is explicit
- delegation contract is explicit
- route/action distinction is preserved

### Wave 5: Agent Runtime

Goal:

Wrap active workforce execution in a runtime contract before changing execution behavior.

Scope:

- adapt `agentManager` to execution
- adapt workforce orchestrator to runtime routing
- adapt `agentMemoryService` to runtime memory
- adapt `GET /api/v1/ai-workforce` to read projection
- adapt `POST /api/v1/ai-workforce/execute` to execution request
- preserve executor modules as tool implementations

First-wave consumers:

- WorkforceDashboard read state
- workforce API read route
- route-entry consumers from CEO/Journey

Do not cut over yet:

- execution route branching
- durable memory replacement
- lifecycle expansion
- plan-gating changes

Exit criteria:

- execution request contract handles direct `agentId`, goal orchestration, and default stage fallback
- lifecycle minimum semantics are defined
- metadata memory is wrapped and marked transitional
- executor output is normalized through result/action contract

### Wave 6: Growth Loop

Goal:

Create a normalized growth read projection across acquisition, activation, retention, referral, and expansion.

Scope:

- adapt acquisition facts from funnel/lead/content/calendar/metadata
- adapt activation from mission/journey/activation sidecars
- adapt retention from followup/CRM/WhatsApp/automation/analytics/team/franchise
- adapt referral from invite/register/member sponsor flow
- adapt expansion from platform/beta/system-monitoring/team/franchise/CEO/funnel-os
- adapt AI COO recommendations and Agent Runtime outcomes as advisory/action inputs

First-wave consumers:

- bounded module dashboards
- read-only reporting surfaces
- non-command platform read models through adapter

Do not cut over yet:

- DashboardV4
- AI recommendation surfaces
- automation command paths
- platform/team/franchise mixed dashboards

Exit criteria:

- GrowthLoop read contract separates facts, readiness, recommendations, and scope
- domain writers remain authoritative for facts
- next-action conflicts are routed through AI COO/Journey/Business State instead of surface-local rules
- mixed dashboards are ready for consumer wave planning

## 3. Adapter Strategy

### 3.1 Adapter Principles

1. Adapters preserve current runtime behavior while introducing canonical read contracts.
2. Adapters do not change write ownership unless a layer-specific command-boundary task exists.
3. Adapters must label source, confidence, scope, and fallback origin where the existing system has competing authorities.
4. Mixed consumers move last.
5. Retirement happens only after adapter consumers are stable and direct references are removed.

### 3.2 Required Adapters

| Layer | Adapter | Purpose |
| --- | --- | --- |
| Interview | `BrandInterview.answers -> InterviewProfileSnapshot` | raw answer capture to profile read contract |
| Interview | `BrandInterview.extractedProfile -> InterviewProfileSnapshot` | intermediate inference compatibility |
| Interview | `BrandProfile -> InterviewProfileSnapshot` | confirmed structured profile |
| Interview | `BrandProfile -> AudienceSnapshot` | confirmed audience |
| Interview | `BrandProfile -> BusinessContextSnapshot` | confirmed business context |
| Interview | `metadata.brand_profile -> legacy profile adapter` | compatibility during retirement |
| Interview | onboarding metadata -> audience/context adapter | side-channel compatibility |
| Business State | `missionService -> BusinessState.stage` | modern stage source |
| Business State | `funnelProgressService -> BusinessState.stage/bottlenecks` | funnel diagnosis input |
| Business State | `funnelHealthService -> BusinessState.readiness/opportunities` | funnel readiness input |
| Business State | `socialSetupValidator -> BusinessState.readiness/bottlenecks` | social readiness input |
| Business State | `trafficEngineService -> BusinessState.readiness` | traffic readiness input |
| Business State | `ceoAdvisorEngine -> BusinessState.readiness/bottlenecks/opportunities` | strategic advisory input |
| Business State | `useDashboardMission -> BusinessState consumer adapter` | high-fan-out compatibility |
| Journey | `missionService -> JourneyState.progression` | modern progression |
| Journey | `completedChecks + JOURNEY_MAP -> JourneyState.milestones` | milestone projection |
| Journey | `getNextJourneyAction() -> JourneyState.nextAction` | route-level next action |
| Journey | `useDashboardMission -> JourneyState dashboard adapter` | dashboard compatibility |
| Journey | `useActivation -> JourneyState activation adapter` | activation compatibility |
| Journey | `missionEngineService -> legacy Journey bridge` | temporary retirement bridge |
| AI COO | `AI Coach Recommend Route -> COO tactical recommendation` | tactical recommendation input |
| AI COO | `ceoAdvisorEngine -> COO strategic recommendation` | strategic recommendation input |
| AI COO | `agentManager -> COO assignment` | assignment input |
| AI COO | `workforce-orchestrator -> COO delegation` | delegation input |
| AI COO | `ai-workforce/execute -> COO execution-plan adapter` | bridge to runtime |
| Agent Runtime | `agentManager -> AgentRuntime.execution` | selected executor and result path |
| Agent Runtime | `agentManager.getWorkforceState() -> AgentRuntime.lifecycle` | current lifecycle read |
| Agent Runtime | `workforce-orchestrator -> AgentRuntime.routing` | goal routing bridge |
| Agent Runtime | `agentMemoryService -> AgentRuntime.memory` | metadata memory bridge |
| Agent Runtime | `GET /api/v1/ai-workforce -> AgentRuntime read projection` | read route bridge |
| Agent Runtime | `POST /api/v1/ai-workforce/execute -> AgentRuntime execution adapter` | branch-preserving execution bridge |
| Agent Runtime | executor modules -> `AgentRuntime.toolExecution` | tool output normalization |
| Growth Loop | funnel/public submit/lead/content -> acquisition facts | preserve factual acquisition chain |
| Growth Loop | lead magnet/traffic/funnel health/progress -> acquisition readiness | derived readiness |
| Growth Loop | mission/activation/roadmap/revenue -> activation signals | activation compatibility |
| Growth Loop | followup/CRM/WhatsApp/automation/analytics/team/franchise -> retention signals | separate retention meanings |
| Growth Loop | invite/register -> referral facts | validity, creation, consumption |
| Growth Loop | platform/beta/system-monitoring/team/franchise -> expansion signals | preserve scope |
| Growth Loop | AI COO + Agent Runtime -> growth action inputs | advisory and execution outcomes |

## 4. Retirement Strategy

### 4.1 Interview Authority

| Classification | Items |
| --- | --- |
| KEEP | `BrandInterview.answers`, `BrandProfile` |
| RETIRE | direct `metadata.brand_profile` writes, direct legacy metadata reads, page-local authority merges, localStorage/query/default funnel mode authorities once replacement exists |
| ADAPTER | `BrandInterview.extractedProfile`, onboarding metadata, `BrandContextProvider`, legacy profile metadata compatibility |
| UNRESOLVED | business mode canonical authority |

### 4.2 Business State

| Classification | Items |
| --- | --- |
| KEEP | `funnelProgressService`, `funnelHealthService`, `missionService`, `socialSetupValidator`, `trafficEngineService` as source inputs |
| RETIRE | `missionEngineService`, legacy `/api/mission/*`, duplicated readiness proxies, page-local bottleneck formatting, duplicated next-action systems |
| ADAPTER | `ceoAdvisorEngine`, `getNextJourneyAction`, `useActivation`, `socialSetupService.getReadiness`, `calculateReadiness`, `useDashboardMission`, mission-engine retirement bridge |
| UNRESOLVED | final dashboard cutover sequence; exact opportunity collapse rule |

### 4.3 Journey

| Classification | Items |
| --- | --- |
| KEEP | `journey-map.ts`, `missionService`, `getNextJourneyAction()` |
| RETIRE | `missionEngineService`, `missionStages.ts`, legacy `/api/mission/*`, duplicate dashboard and activation next-action logic after adapter cutover |
| ADAPTER | `useDashboardMission`, `useActivation`, `activation-service.ts`, `ai-coach-service.ts`, legacy mission bridge |
| UNRESOLVED | `revenue-journey-service.ts` ownership relative to Journey |

### 4.4 AI COO

| Classification | Items |
| --- | --- |
| KEEP | AI Coach Recommend Route, `ceoAdvisorEngine`, `agent-registry`, `agentManager`, `workforce-orchestrator` as source inputs |
| RETIRE | `AiRecommendationPanel`, duplicate dashboard recommendation rules, duplicated CTA route generation, duplicated execution branch selection after runtime adapter |
| ADAPTER | `ai-coach-service`, `AICoachCard`, `WorkforceDashboard`, `ai-workforce` routes, COO plan consumer adapters |
| UNRESOLVED | tactical vs strategic recommendation collapse rule; assignment taxonomy collapse rule |

### 4.5 Agent Runtime

| Classification | Items |
| --- | --- |
| KEEP | `AGENT_REGISTRY`, `getAgentsForPlan()`, `agentManager`, executor modules, `AIUsageLog` as adjacent telemetry |
| RETIRE | duplicated execution selection, stage fallback routing after canonical plan, metadata-backed execution history after durable log exists, UI-only pending state as lifecycle substitute |
| ADAPTER | `getAgentsForMissionStage()`, workforce orchestrator routing, `agentMemoryService`, workforce read/execute routes, executor output adapters |
| UNRESOLVED | durable execution log, full lifecycle model, final memory persistence |

### 4.6 Growth Loop

| Classification | Items |
| --- | --- |
| KEEP | funnel, public submit, lead, content, mission, followup, invite/register, platform, beta, system-monitoring, franchise, automation command writers as domain authorities |
| RETIRE | dashboard-local recommendation rules, duplicated next-action engines, duplicate retention labels, synthetic team metrics as canonical truth, duplicate invite consumption shape after contract resolution |
| ADAPTER | lead magnet, traffic, funnel health/progress, activation sidecars, WhatsApp, automation action signals, analytics, team-engine, CEO advisor, AI coach, platform/team/franchise consumers |
| UNRESOLVED | global GrowthLoop resolver, dashboard cutover, AI recommendation cutover, automation command boundary |

## 5. Global Blockers

1. Business mode has no canonical authority.
2. Dashboard remains the highest-risk mixed consumer across Interview, Business State, Journey, AI COO, and Growth Loop.
3. `useDashboardMission()` is a cross-layer wrapper that currently mixes mission, journey, team summary, AI advice, and next action.
4. Activation taxonomy remains separate from Journey and Business State.
5. Legacy mission chain is still live.
6. Tactical vs strategic recommendation is unresolved in AI COO.
7. Workforce execution route is branch-based and cannot be treated as passive transport.
8. Agent Runtime lacks durable execution lifecycle and execution log.
9. Agent memory is metadata-backed.
10. Growth Loop has no global resolver and uses domain-local/surface-local precedence.
11. Recommendation and next-action conflicts exist across Journey, Business State, AI COO, Growth Loop, dashboard, CEO, funnel, CRM, and automation.
12. Domain writers must remain authoritative until explicit command-boundary tasks are defined.
13. Platform/team/franchise expansion scopes are not one global growth metric.
14. Referral has separate meanings: member invite referral and CRM lead source referral.
15. Retirement cannot begin before adapter consumers are stable.

## 6. Migration Risk Matrix

| Layer | Readiness | Primary Risk | Consumer Risk | Write Risk | Overall Risk |
| --- | --- | --- | --- | --- | --- |
| Interview Authority | READY WITH CONDITIONS | business mode unresolved; legacy metadata | medium-high | medium | High |
| Business State | READY WITH CONDITIONS | no canonical state authority yet | high for dashboard/activation | low-medium | High |
| Journey | READY WITH CONDITIONS | wrapper precedence and legacy mission | high for dashboard/activation/AI | medium | High |
| AI COO | READY WITH CONDITIONS | recommendation and assignment collapse | high for dashboard/workforce execution | medium | High |
| Agent Runtime | READY WITH CONDITIONS | execute route, lifecycle, memory | medium | high | High |
| Growth Loop | READY WITH CONDITIONS | no global resolver; mixed domain meanings | very high | high if command paths are touched | Very High |

### Risk Ranking

| Rank | Layer | Reason |
| ---: | --- | --- |
| 1 | Growth Loop | widest surface, mixed consumers, direct domain writers, no global resolver |
| 2 | Agent Runtime | execution and memory behavior concentrated in active branch-heavy routes |
| 3 | AI COO | recommendation/assignment/routing split across multiple surfaces |
| 4 | Journey | progression is clear, but dashboard/activation/legacy wrappers are live |
| 5 | Business State | source discovery is strong, but canonical projection does not exist yet |
| 6 | Interview Authority | strongest entry point, but business mode remains unresolved |

## 7. Final Execution Sequence

### 7.1 PR Sequence

#### PR 1: Global Contracts And Naming

- add architecture-only contracts for six layer outputs
- define shared terms:
  - fact
  - projection
  - recommendation
  - command
  - scope
  - fallback
- no consumer cutover

#### PR 2: Interview Authority Projection Adapters

- add profile/audience/context read adapters
- preserve `BrandInterview` and `BrandProfile`
- bridge metadata and onboarding side-channels
- keep business mode unresolved and explicit

#### PR 3: Business State Projection Adapters

- add stage/readiness/bottleneck/opportunity adapters
- source from mission, funnel, social, traffic, CEO
- no dashboard cutover

#### PR 4: Journey Projection Adapters

- add progression/milestone/mission/next-action adapters
- bridge legacy mission chain
- prepare dashboard/activation compatibility adapters

#### PR 5: AI COO Planning Adapters

- add tactical/strategic recommendation adapters
- add delegation and assignment adapters
- separate CTA routing from execution routing
- keep legacy dashboard recommendation live but marked as retirement target

#### PR 6: Agent Runtime Execution Adapter

- wrap `ai-workforce/execute`
- preserve direct agent, goal orchestration, and stage fallback behavior
- normalize execution result/action shape
- wrap metadata memory without replacing persistence

#### PR 7: Growth Loop Read Projection Adapters

- add acquisition/activation/retention/referral/expansion adapters
- preserve all domain writers
- label scope and source for every growth signal
- no mixed dashboard cutover

#### PR 8: First Consumer Cutover

- cut over bounded read-only or low-risk consumers:
  - Journey page
  - Funnel OS read surfaces
  - Social Setup readiness
  - Traffic readiness
  - AI Coach read plan
  - WorkforceDashboard read state
  - module-specific growth dashboards through adapters

#### PR 9: Mixed Consumer Cutover

- cut over higher-risk consumers only after adapter outputs are stable:
  - DashboardV4
  - `useDashboardMission`
  - ActivationDashboard
  - CEO Mode
  - platform operating dashboards
  - team/franchise dashboards
  - analytics dashboards

#### PR 10: Command Boundary Review

- review write paths only after read cutover:
  - BrandProfile writes
  - mission writes
  - workforce execution
  - followup writes
  - invite/register transaction
  - automation lead/activity writes
  - franchise metadata writes

#### PR 11: Retirement PR A

- retire zero-reference compatibility readers
- retire legacy metadata reads where consumers have moved
- retire legacy recommendation panels where canonical recommendation consumers exist

#### PR 12: Retirement PR B

- retire legacy mission chain if references are zero
- retire duplicate dashboard/activation wrappers if canonical consumers exist
- retire duplicate execution branch helpers only after Agent Runtime contract is proven

#### PR 13: Final Authority Audit

- verify no legacy authority paths remain for the migrated projections
- verify direct domain writers remain intentional
- verify no mixed consumer bypasses canonical read contracts

### 7.2 Consumer Cutover Sequence

1. Low-risk read-only consumers.
2. Bounded module consumers.
3. Single-layer dashboards.
4. AI recommendation consumers.
5. Workforce read consumers.
6. Journey and activation consumers.
7. Main dashboard.
8. CEO mode.
9. Platform admin.
10. Team/franchise dashboards.
11. Automation surfaces.

### 7.3 Retirement Sequence

1. Retire legacy reads.
2. Retire legacy local projections.
3. Retire duplicate recommendation surfaces.
4. Retire legacy mission chain.
5. Retire metadata-backed compatibility only after durable replacement exists.
6. Retire duplicate execution routing only after Agent Runtime is stable.
7. Retire duplicate Growth Loop next-action rules last.

### 7.4 Non-Negotiable Execution Rules

1. Do not replace command writers during read projection migration.
2. Do not migrate DashboardV4 first.
3. Do not collapse tactical and strategic recommendations without a rule.
4. Do not treat Agent Runtime lifecycle as complete until durable states exist.
5. Do not treat Growth Loop as a direct writer.
6. Do not retire business mode sources until canonical business mode authority exists.
7. Do not retire legacy mission runtime before dashboard, activation, and AI consumers are moved.

## Final Blueprint Judgment

V7 can enter global migration planning.

The correct program is:

```text
contracts -> adapters -> bounded consumers -> mixed consumers -> command review -> retirement -> final audit
```

The incorrect program would be:

```text
direct runtime replacement -> dashboard first -> retire legacy paths early
```

All six layers are migration-plannable, but none should be treated as implementation-ready without adapter contracts and staged consumer cutover.
