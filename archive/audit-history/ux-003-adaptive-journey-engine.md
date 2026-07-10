# UX-003 Adaptive Journey Engine

## Objective

Replace static onboarding assumptions with adaptive journey selection.

Journey Engine now decides:

- Journey selection
- Journey switching basis
- Stage progression
- Unlock path

Mission Engine decides the current mission from the Journey Engine projection.

## Authority Chain

Implemented chain:

```text
Business State
Interview Authority
Journey Engine
Mission Engine
AI COO
Dashboard Projection
Dashboard UI
```

## Deliverables

Created:

- `src/modules/journey-engine/journey-engine-service.ts`
- `src/modules/journey-engine/journey-selector.ts`
- `src/modules/journey-engine/journey-state-machine.ts`
- `src/modules/journey-engine/journey-projection.ts`
- `src/__tests__/services/journey-engine-tests.ts`

## Journey Types

Supported adaptive journeys:

- `creator`
- `service`
- `retail`
- `team_building`

Selection inputs:

- Business Stage
- Experience Level
- Offer Status
- Audience Status
- Revenue Status
- Content Readiness
- Traffic Readiness
- Business Mode
- Primary Offer
- Revenue Model
- Primary Growth Channel

## Consumer Changes

### Mission Engine

`MissionEngineAuthorityService` now consumes `journeyEngineService.getJourneyProjection()`.

Mission Engine no longer owns the mission path definition.

### Dashboard Projection

Dashboard projection now receives:

- `currentJourney`
- `currentMission`
- `progressPath`
- `nextMilestone`

### Dashboard UI

Dashboard V5 displays the current journey title in the mission hero.

### AI COO

AI COO continues to consume Mission Engine authority. It can recommend and prioritize, but does not change the journey or mission sequence.

## Verification

Commands:

```bash
pnpm exec vitest run src/__tests__/services/journey-engine-tests.ts src/__tests__/services/mission-engine-authority.test.ts src/__tests__/services/dashboard-projection-adapter.test.ts src/lib/observability/__tests__/event-envelope.test.ts
pnpm type-check
git diff --check
```

Additional boundary check:

```bash
grep -RIn "JOURNEY_PATHS\|resolveJourneyStateMachine\|selectJourney" src/modules/mission-engine src/modules/dashboard src/modules/ai-coo
```

Expected result:

- No Journey Engine path selection logic in Mission Engine, Dashboard, or AI COO.

## Success Criteria

Two users with different business profiles now receive different mission paths:

- Retail users receive Retail Journey.
- Team building users receive Team Building Journey.
- Service context automatically selects Service Journey without manual configuration.
