# DASH-001 AI COO First Dashboard Philosophy

Status: Approved baseline
Owner: NextShift OS
Scope: Dashboard, Mission Engine, AI COO projection

## Objective

The dashboard is an AI COO command surface, not a widget gallery. It must show one clear operating decision:

- What state the business is in
- What gap blocks the next stage
- What mission matters today
- Why this mission was selected
- What outcome the user should expect
- Where the user should go next

## Product Rule

The dashboard is display-only for intelligence. It must never calculate business state, bottleneck, mission priority, mission reasoning, or route selection in React components.

## Source Of Truth

| Domain | Source |
| --- | --- |
| Business state | `business-state` service |
| Journey state | `journey-engine` service |
| Mission selection | `mission-engine` authority service |
| AI COO plan | `ai-coo` plan service |
| Dashboard projection | `dashboard/adapters/DashboardProjectionAdapter.ts` |
| Dashboard display | `dashboard/components/*` |

## Dashboard Contract

The dashboard receives these fields from the projection layer:

- `businessState.currentState`
- `businessState.missingRequirements`
- `missionEngine.bottleneck`
- `missionEngine.reasoning`
- `missionEngine.currentGap`
- `missionControl.title`
- `missionControl.whyItMatters`
- `missionControl.expectedOutcome`
- `missionControl.route`
- `missionControl.ctaLabel`
- `aiDecision.decisionReason`
- `progressPath`
- `value.outcomeMetrics`

## UX Principles

1. One primary mission above all secondary signals.
2. Reasoning explains the operating decision, not implementation internals.
3. Metrics support the mission; they do not compete with it.
4. Advanced modules stay hidden until the projection says they are unlocked.
5. The dashboard card count stays constrained and action-first.

## Non Goals

- Do not add autonomous execution.
- Do not add a new bottleneck engine.
- Do not add a new priority engine.
- Do not duplicate mission reasoning in UI components.

## Acceptance Criteria

- Dashboard components render projection fields only.
- Mission reasoning is generated once by the backend projection path.
- Production routes in dashboard actions use canonical production routes.
- Mission decisions are traceable through audit metadata.
