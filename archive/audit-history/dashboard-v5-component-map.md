# Dashboard V5 Component Map

## Active Route

`src/app/(auth)/dashboard/page.tsx`

Member and incomplete operator dashboards render:

`src/modules/dashboard/components/DashboardV4.tsx`

## Projection Source

`src/modules/dashboard/hooks/useDashboardMission.ts`

Fetches:

`/api/v1/dashboard/projection`

## Projection Adapter

`src/modules/dashboard/adapters/DashboardProjectionAdapter.ts`

Consumes only:

- `businessStateService.getBusinessState()`
- `journeyStateService.getJourneyState()`
- `cooPlanService.getCOOPlan()`
- `growthLoopStateService.getGrowthLoopState()`
- `getAnalyticsProjection()`

## Dashboard V5 Sections

### Today's Mission

Source:

- `projection.missionControl`

### Progress Path

Source:

- `projection.progressPath`

### AI COO Recommendation

Source:

- `projection.recommendations[0]`

### Business Snapshot

Source:

- `projection.snapshot`

### Quick Access

Source:

- `projection.quickAccess`

## Authority Boundary

Dashboard component owns:

- UI layout
- Collapsed state
- Navigation click handlers
- Presentation

Dashboard component does not own:

- Mission selection
- Journey action selection
- Progress derivation
- Recommendation selection
- Access unlock rules
