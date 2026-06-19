# Journey Authority Consumer Risk Report

## Highest-Risk Consumers

### 1. `src/modules/dashboard/hooks/useDashboardMission.ts`

Risk: High

Reason:

- Selects the dashboard mission surface
- Selects dashboard next action
- Injects AI coach guidance
- Wraps multiple authorities into one output contract

Impact:

- Any Journey cutover that misses this hook will leave dashboard behavior inconsistent even if the canonical Journey source is correct.

### 2. `src/modules/dashboard/components/DashboardV4.tsx`

Risk: High

Reason:

- Drives the main post-login user experience
- Reads both `useDashboardMission()` and `useActivation()`
- Changes CTA routing based on mission stage and activation completion

Impact:

- This is the most visible mixed-authority consumer in the product.

### 3. `src/modules/activation/hooks/useActivation.ts`

Risk: High

Reason:

- Reinterprets journey state into day-based activation progression
- Selects `dayMission`
- Selects activation level
- Emits its own progress percent

Impact:

- A Journey migration that ignores activation will preserve duplicate semantics even if canonical mission state is fixed.

### 4. `src/modules/mission-engine/components/MissionCard.tsx`

Risk: High

Reason:

- Still consumes the legacy mission-engine runtime
- Still drives mission completion and mode switching
- Still renders current mission, progress, and achievements

Impact:

- This is the clearest live legacy consumer.
- It keeps the old mission authority operational.

### 5. Legacy `/api/mission/*` routes

Risk: High

Files:

- `src/app/api/mission/current/route.ts`
- `src/app/api/mission/complete/route.ts`
- `src/app/api/mission/mode/route.ts`

Reason:

- They are runtime entry points for the legacy mission path.
- They expose progression, mission, and achievement data outside the modern `/api/v1/mission/*` chain.

Impact:

- As long as these routes remain live, legacy mission consumers remain valid runtime consumers.

### 6. `src/app/(auth)/journey/page.tsx`

Risk: High

Reason:

- It is the canonical user-facing journey page.
- It uses canonical mission state, but it still derives next action through heuristic thresholds.

Impact:

- Journey page can drift from canonical stage semantics if threshold logic diverges from the actual journey model.

### 7. AI routing surfaces

Risk: High

Files:

- `src/app/api/v1/ai-workforce/route.ts`
- `src/app/api/v1/ai-workforce/execute/route.ts`
- `src/modules/ai-coach/ai-coach-service.ts`

Reason:

- AI workforce reads `currentStageId` directly.
- AI coach reads mission identity through dashboard wrappers.
- These are two different journey-consumption contracts.

Impact:

- AI can continue to make decisions from stale or divergent journey semantics after a partial migration.

## Medium-Risk Consumers

### Team journey reporting

Files:

- `src/app/api/v1/team/journey-progress/route.ts`
- `src/modules/team/components/TeamJourneyProgress.tsx`

Reason:

- Reads progression only
- Does not drive mission selection
- Still depends on journey helper semantics staying stable

### Sidebar

File:

- `src/components/layouts/Sidebar.tsx`

Reason:

- Reads stage-level journey state for nav emphasis and unlock framing
- Lower orchestration risk than Dashboard, but still user-visible

### Content, Lead, and CRM mission panels

Files:

- `src/modules/content-engine/components/ContentCommandCenter.tsx`
- `src/modules/content-engine/components/ContentDashboard.tsx`
- `src/modules/lead-engine/components/LeadDashboard.tsx`
- `src/modules/crm-engine/components/CRMDashboard.tsx`

Reason:

- They consume mission context, but they do not choose mission authority themselves
- Risk comes from inherited dashboard wrapper behavior

## Low-Risk Consumers

### Admin overview displays

Files:

- `src/modules/admin/components/overview/JourneySection.tsx`
- `src/modules/admin/components/overview/MembersSection.tsx`

Reason:

- Display and reporting only
- They do not choose missions or next actions directly

### Revenue progress display

Files:

- `src/modules/revenue-activation/hooks/useRevenueJourney.ts`
- `src/modules/revenue-activation/components/RevenueProgress.tsx`

Reason:

- Sidecar display path
- Journey-adjacent but not the main user mission path

## Hidden Consumer Risks

### Hidden Risk 1: wrapper-on-wrapper consumption

Current chain:

- `missionService`
- `useMissionState()`
- `useDashboardMission()`
- `DashboardV4`
- downstream dashboards

Problem:

- Migration at the source layer will not be enough if wrapper contracts are not normalized.

### Hidden Risk 2: heuristic next-action duplication

Current duplicated next-action logic appears in:

- `getNextJourneyAction()`
- `useActivation()`
- `JourneyPage`
- `useDashboardMission()`

Problem:

- Multiple consumers can render different next-step semantics from the same underlying progress.

### Hidden Risk 3: local progress estimation

Current example:

- `workspaceHealthService.estimateJourneyProgress()`

Problem:

- Admin surfaces can show progress values that are not canonical and are not read from `missionService`.

## Overall Risk Judgment

The highest consumer risk is not the existence of many readers by itself. The highest risk is the number of mixed wrappers that reinterpret journey data before rendering it.

Current risk order:

1. Dashboard wrapper chain
2. Activation wrapper chain
3. Legacy mission-engine path
4. AI routing split
5. Admin heuristic reporting

## Consumer Cutover Sensitivity

If Journey authority is migrated later, the most sensitive consumers will be:

- `useDashboardMission()`
- `DashboardV4`
- `useActivation()`
- `MissionCard`
- legacy `/api/mission/*`
- `/journey`
- AI workforce execution routes

These consumers are the ones most likely to preserve duplicate runtime behavior after a partial migration.
