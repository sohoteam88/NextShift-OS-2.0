# Journey Authority Migration Readiness Review

## Final Decision

`READY WITH CONDITIONS`

Journey Authority now has enough audit evidence to enter migration planning.

It is not implementation-ready, and it is not runtime-clean. But source, consumer, and precedence discovery are complete enough to plan the migration waves.

## 1. Source Authority Review

| Source | Status | Reason |
| --- | --- | --- |
| `journey-map.ts` | KEEP | strongest modern progression and milestone taxonomy |
| `missionService` | KEEP | strongest active persisted progression authority |
| `missionEngineService` | RETIRE | duplicate legacy progression and mission write/read chain |
| `missionStages.ts` | RETIRE | duplicate legacy stage map and milestone taxonomy |
| `getNextJourneyAction()` | KEEP | strongest explicit next-action resolver on the modern journey page |
| `useDashboardMission()` | ADAPTER | high-fan-out dashboard wrapper mixing mission, next action, and AI advice |
| `useActivation()` | ADAPTER | active consumer-wrapper that remaps journey truth into day-based activation semantics |
| `activation-service.ts` | ADAPTER | activation taxonomy remains real, but should not become canonical Journey truth |
| `ai-coach-service.ts` | ADAPTER | advisory layer, not core route or mission authority |
| `revenue-journey-service.ts` | UNRESOLVED | still a sidecar progression system; ownership relative to Journey is not yet settled |

## 2. Projection Readiness

### Progression

Status: `READY`

Reason:

- source identified
- consumers identified
- precedence identified
- conflicts identified

Primary issue is not discovery. It is duplicate runtime ownership between modern, legacy, and sidecar readers.

### Milestones

Status: `READY`

Reason:

- canonical milestone model identified as `completedChecks + JOURNEY_MAP`
- legacy milestone model identified
- activation and revenue sidecar milestone systems identified
- consumer and conflict surfaces documented

### Missions

Status: `READY WITH CONDITIONS`

Reason:

- mission consumers and conflicting mission models are identified
- but mission projection is the most fragmented area
- there is no single current mission winner across dashboard, activation, and legacy mission UI

This is still migration-plannable, but it will need explicit adapter strategy.

### Next Actions

Status: `READY WITH CONDITIONS`

Reason:

- strongest base resolver identified as `getNextJourneyAction()`
- wrapper overlays identified in dashboard and activation
- AI coach next-action layer identified as advisory, not route-authoritative

This is migration-plannable, but wrapper precedence must be tracked as a blocker.

## 3. Consumer Migration Readiness

| Consumer Cluster | Status | Reason |
| --- | --- | --- |
| Journey Page | Ready For Migration | modern chain already clear: `missionService -> getNextJourneyAction()` |
| Dashboard | Blocked | `useDashboardMission()` and `DashboardV4` still mix mission, activation, AI, and wrapper CTA logic |
| Activation | Blocked | `useActivation()` emits its own day-based progression, mission, and activation-level semantics |
| Legacy Mission UI | Ready For Migration | legacy chain is clearly isolated and identified as retirement target |
| Team Progress | Ready For Migration | reporting-only consumer path is mapped and lower risk |
| AI Consumers | Blocked | AI Coach and AI workforce consume Journey through different contracts |
| Revenue Journey | Not Ready | ownership relative to Journey is still unresolved |

## 4. Retirement Candidates

### Progression

- `missionEngineService`
- `missionStages.ts`
- legacy `/api/mission/*`

### Missions

- duplicate dashboard mission selector after adapter cutover
- legacy mission current/progress path

### Next Actions

- wrapper-specific next-action duplication inside `useDashboardMission()`
- wrapper-specific next-action duplication inside `useActivation()`
- any AI-coach-side next-action contract that competes with route CTA authority

## 5. Required Adapters

These adapters will be needed during migration planning:

1. `missionService -> JourneyState.progression`
2. `missionService.completedChecks + JOURNEY_MAP -> JourneyState.milestones`
3. `getNextJourneyAction() -> JourneyState.nextAction`
4. dashboard mission selector -> JourneyState mission consumer adapter
5. `useDashboardMission()` -> JourneyState dashboard adapter
6. `useActivation()` -> JourneyState activation adapter
7. legacy `missionEngineService` -> temporary legacy bridge until runtime references hit zero
8. AI coach / AI workforce -> JourneyState consumer adapters

## 6. Migration Blockers

1. Wrapper precedence
   - dashboard and activation both reinterpret canonical journey state

2. Activation taxonomy
   - `DAY_MISSIONS` and activation day progression are still their own model

3. Legacy mission chain
   - `missionEngineService`, `missionStages.ts`, and `/api/mission/*` are still live

4. Dashboard mission selector
   - dashboard still chooses `current mission` through a separate selector contract

5. AI coach next-action layer
   - AI advice is not authoritative, but still shapes user action messaging

6. AI workforce stage routing
   - direct `currentStageId` consumption is a separate journey-consumption contract

7. Revenue journey ownership
   - still unresolved whether it is inside Journey or a parallel business progression surface

8. Admin heuristic progress
   - `workspaceHealthService` estimates progress locally instead of consuming canonical journey percent

## 7. Migration Readiness Score

| Area | Score |
| --- | ---: |
| Source Audit | 95 |
| Consumer Audit | 93 |
| Precedence Audit | 92 |
| Projection Readiness | 84 |
| Migration Risk | 68 |

Overall: `86/100`

Interpretation:

- audit completeness is high
- migration risk is still meaningful
- planning can start, but implementation waves must treat wrappers and legacy consumers as first-class blockers

## 8. Readiness Judgment

Journey Authority is ready for migration planning because:

- source inventory exists
- consumer inventory exists
- precedence and conflict behavior are documented
- keep / adapter / retire decisions are now explicit enough to structure waves

Journey Authority is not `READY` because:

- dashboard and activation wrappers still own competing contracts
- legacy mission runtime is still live
- AI surfaces still consume Journey through split interfaces
- revenue journey ownership is unresolved

So the correct decision is:

`READY WITH CONDITIONS`
