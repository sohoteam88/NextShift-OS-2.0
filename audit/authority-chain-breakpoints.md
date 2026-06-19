# C2 Authority Chain Breakpoints

## Interview -> Business State

Source: `completeBrandDiscovery()` and Interview Authority.

Consumer: `BusinessStateAssembler`.

Transport path:

`finish route -> completeBrandDiscovery() -> brandInterview / brandProfile / user.metadata.brand_profile / userProgress -> InterviewAuthorityService -> BusinessStateAssembler`

Failure mode:

`businessMode` may not propagate if the interview profile does not include a canonical business mode field.

Fallback path:

Interview Authority falls back through brand profile, brand interview extracted profile, legacy metadata profile, then onboarding context.

Status: partial pass.

## Business State -> Journey

Source: `BusinessStateService`.

Consumer: `JourneyStateAssembler` / `JourneyProgressionAdapter`.

Transport path:

`BusinessStateService.getBusinessState() -> JourneyStateAssembler -> adaptJourneyProgression(context)`

Failure mode:

`adaptJourneyProgression()` ignores the supplied Business State context, so stage/readiness/bottleneck changes do not drive Journey.

Fallback path:

Journey derives from `userProgress + JOURNEY_MAP`.

Status: weak link.

## Journey -> AI COO

Source: `JourneyStateService`.

Consumer: `COOPlanAssembler`.

Transport path:

Expected: `JourneyStateService -> COOPlanAssembler -> COOPlan`

Actual: `userProgress.currentStageId -> COOPlanAssembler`; `ceoAdvisorEngine -> CEORecommendationAdapter -> COO recommendations`

Failure mode:

Journey advancement can occur without COO consuming Journey milestones, next action, or revenue progress.

Fallback path:

COO uses `userProgress.currentStageId` and CEO Advisor report.

Status: weak link.

## AI COO -> Agent Runtime

Source: `COOPlan.assignments`.

Consumer: `RuntimeStateAssembler`.

Transport path:

Expected: `COOPlanService.getCOOPlan() -> RuntimeStateAssembler -> pendingAssignments`

Actual: `userProgress.currentStageId -> RuntimeAssignmentAdapter -> pendingAssignments`

Failure mode:

COO assignment exists but Runtime never sees it.

Fallback path:

Runtime generates default stage assignment via `agentManager.getRecommendedAgents`.

Status: breakpoint.

## Agent Runtime -> Growth Loop

Source: `RuntimeResult`.

Consumer: `GrowthLoopAssembler`.

Transport path:

Expected: `RuntimeResult / agent execution report -> growth signal -> GrowthLoopState`

Actual: `agent execution -> user.metadata.agent_memory`; Growth Loop reads counters and activity/AI usage, not runtime memory.

Failure mode:

Execution completes but Growth Loop analytics and growth signals do not change.

Fallback path:

Growth Loop derives from content, leads, funnels, customers, follow-ups, invites, activity count, AI usage count, and completed checks.

Status: breakpoint.

## Summary

The chain is coherent through shared database writes at the Interview/Journey level, but it becomes fragmented once AI COO, Runtime, and Growth Loop start deriving local projections instead of consuming upstream authority DTOs.
