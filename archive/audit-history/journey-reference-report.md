# Journey Reference Report

Status: P3-006 authority audit
Authority: Journey
Final Decision: PASS

## Approved Runtime References

The bounded cutover introduced Journey authority references only in the approved read-only route:

- `src/app/api/v1/team/journey-progress/route.ts`
  - imports `journeyStateService`
  - imports `toJourneyProgressViewModel`
  - calls `journeyStateService.getJourneyState(member.id)`

## Internal Journey References

The Journey authority path remains inside the Journey module:

- `src/modules/journey/services/JourneyStateService.ts`
- `src/modules/journey/adapters/JourneyStateAssembler.ts`
- `src/modules/journey/adapters/JourneyProgressionAdapter.ts`
- `src/modules/journey/adapters/JourneyMilestoneAdapter.ts`
- `src/modules/journey/adapters/JourneyMissionAdapter.ts`
- `src/modules/journey/adapters/JourneyNextActionAdapter.ts`
- `src/modules/journey/adapters/JourneyRevenueProgressAdapter.ts`
- `src/modules/journey/view-models/JourneyProgressViewModelAdapter.ts`

## Removed Target Route References

The target route no longer references:

- `getProgressPercent`
- `getStageById`
- `completedChecks`
- `currentStageId`

This confirms the route no longer performs direct stage/progress derivation from legacy progression fields.

## Allowed Direct Reads

The route still performs limited direct Prisma reads for route-level responsibilities:

- member selection under tenant/team authorization rules
- member `id`
- member `name`
- member `userProgress.lastActivityAt`

These reads do not represent Journey progression authority.

## Blocked Zone References

No JourneyStateService references were found in:

- `src/modules/dashboard`
- `src/app/(auth)/journey`
- `src/modules/activation`
- `src/modules/ai`
- `src/modules/ai-coach`
- `src/modules/revenue-activation`
- `src/modules/growth-roadmap`
- `src/modules/mission`
- `src/modules/mission-engine`
- `src/app/api/v1/ai`
- `src/app/api/mission`

## Conclusion

Reference scope is bounded and compliant. The migration does not create authority drift outside the approved team journey-progress route.
