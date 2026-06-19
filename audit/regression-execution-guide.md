# C3 Regression Execution Guide

## Final Decision

READY FOR D1

## Execution Order

Run tests in this order so upstream failures stop downstream noise.

## 1. Static Guardrails

1. Run type-check.

```bash
pnpm type-check
```

2. Search for route regressions.

```bash
grep -RIn "route: '/leads'\\|route: \"/leads\"\\|route: '/traffic'\\|route: \"/traffic\"\\|'/funnel-builder'\\|\"/funnel-builder\"" src/modules src/app src/components
```

Expected:

- No critical journey/sidebar/activation links point users to old lead or traffic routes.

3. Search for local Journey authority bypass in AI COO.

```bash
grep -RIn "currentStageId" src/modules/ai-coo src/modules/agent-runtime
```

Expected:

- AI COO does not use `currentStageId` as primary Journey source.
- Agent Runtime may still read `currentStageId` only for fallback/workforce compatibility.

## 2. Authentication And Routing

1. Create a new signup user.
2. Confirm tenant is created.
3. Confirm role is `operator`.
4. Confirm post-signup route is `/dashboard`.
5. Confirm incomplete operator sees Activation/DashboardV4.
6. Logout and confirm protected route redirects to login.
7. Login again and confirm role routing remains stable.

Stop if any P0 auth test fails.

## 3. Interview Authority

1. Start brand interview.
2. Finish interview.
3. Confirm finish API completes successfully.
4. Confirm `completeBrandDiscovery()` effects:
   - `brandInterview.status` confirmed
   - `brandProfile` upserted
   - `user.metadata.brand_profile` available
   - `brand_builder_state.completed_steps` includes `interview`
   - `userProgress.completedChecks` includes `brand_discovery_completed`
5. Confirm user routes to `/brand-builder/step/profile`.

Stop if interview finish or profile writes fail.

## 4. Business State

1. Load Business State for the same user.
2. Confirm it reads Interview Authority profile/audience/business context.
3. Confirm stage/readiness/bottlenecks/opportunities are present.
4. Confirm missing/fallback sources carry fallback metadata instead of throwing.

## 5. Journey

1. Load JourneyState.
2. Confirm `brand_discovery_completed` advances Journey progress.
3. Change or mock Business State stage/readiness/bottlenecks.
4. Confirm `JourneyState.stage` changes.
5. Confirm `JourneyState.nextAction` remains Journey-owned and is not directly selected by Business State.
6. Confirm milestones and revenue progress still load.

## 6. AI COO

1. Load COOPlan.
2. Confirm COOPlan consumes JourneyState.
3. Confirm first recommendation is Journey-derived.
4. Confirm recommendation reasoning contains:
   - Journey stage
   - milestone context
   - revenue progress context
5. Confirm COO assignments change when Journey stage changes.
6. Confirm CEO advisor recommendations remain present after Journey recommendation.

## 7. Agent Runtime

1. Load RuntimeState via `/api/v1/ai-workforce`.
2. Confirm `pendingAssignments` are mapped from `COOPlan.assignments`.
3. Confirm `sourceAssignmentId` is preserved.
4. Confirm objective and selected agents match COO assignment.
5. Confirm Runtime default stage assignment appears only when COO assignments are empty.
6. POST `/api/v1/ai-workforce/execute` with one agent and confirm legacy execution still works.
7. POST `/api/v1/ai-workforce/execute` with multi-agent goal and confirm legacy execution still works.

## 8. Brand Builder

1. Confirm profile step loads Interview Authority view model.
2. Confirm audience and content pillars are visible.
3. Confirm Brand DNA confirmation writes `brand_dna_confirmed`.
4. Confirm downstream Journey/COO sees the updated stage.

## 9. Content Engine

1. Generate content.
2. Confirm `first_content_generated` is written.
3. Generate 30-day calendar.
4. Generate 90-day calendar.
5. Generate 180-day calendar.
6. Confirm calendar output is visible and does not break content surfaces.

## 10. Funnels

1. Navigate to `/lead-magnet`.
2. Navigate to `/funnel`.
3. Navigate to `/traffic-engine`.
4. Confirm activation/journey/sidebar links use the canonical routes.

## 11. Growth Loop And Analytics

1. Create or verify content/lead/activity data.
2. Load GrowthLoopState.
3. Confirm content, lead, journey, and activity signals update.
4. Load `/api/v1/analytics/member`.
5. Confirm analytics view model remains valid.
6. Confirm empty data returns zero-state analytics, not an error.

## Exit Criteria

READY FOR D1 when:

- All P0 critical tests pass.
- No unwaived P1 authority drift is found.
- `pnpm type-check` passes.
- C2A chain remains scored at least 18/25.

If these fail:

- Do not proceed to D1.
- Create a focused remediation file for the failed group.
