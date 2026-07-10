# AUTH-002 Assignment First Workforce

Date: 2026-06-19

## Objective

Make Runtime Assignments the primary AI Workforce execution path.

Expected authority chain:

Journey State -> AI COO -> COO Assignment -> Runtime Assignment -> Workforce Execution

## Changes

- Updated `src/modules/ai/components/WorkforceDashboard.tsx`.
  - Primary surface is now `Today's Assignments`.
  - Each assignment has a direct `Execute` action.
  - Manual goal input moved into collapsed `Advanced Override`.
  - Manual override requires `overrideReason`.
  - Agent cards are informational instead of primary execution buttons.

- Updated `src/app/api/v1/ai-workforce/execute/route.ts`.
  - Added primary `assignmentId` execution path.
  - Resolves assignment from `runtimeStateService.getRuntimeState(user.id)`.
  - Executes selected Runtime Assignment agents with assignment provenance.
  - Empty POST now executes the first pending Runtime Assignment when available.
  - Manual goal execution remains available only as an override with `overrideReason`.

- Updated `src/modules/agent-runtime/view-models/WorkforceViewModelAdapter.ts`.
  - Exposes `pendingAssignments` to the Workforce UI.

- Updated `src/modules/agent-runtime/telemetry/runtime-telemetry.ts`.
  - Runtime events now include `executionSource`.
  - Supported values: `assignment`, `manual_override`.

- Updated tests:
  - `src/__tests__/api/ai-workforce-execute.test.ts`
  - `src/modules/agent-runtime/telemetry/__tests__/runtime-telemetry.test.ts`

## Provenance Rules

Assignment execution:

```text
executionSource = assignment
assignmentId = runtime assignment id
```

Manual override:

```text
executionSource = manual_override
overrideReason = required for manual goal override
```

## Verification Results

- `grep -RIn "我想要更多客户" src`
  - Only `src/modules/ai/components/WorkforceDashboard.tsx` placeholder in Advanced Override remains.
- `pnpm exec vitest run src/__tests__/api/ai-workforce-execute.test.ts src/modules/agent-runtime/telemetry/__tests__/runtime-telemetry.test.ts`
  - Passed.
- `pnpm type-check`
  - Passed.

## Result

AI Workforce no longer starts from manual goal input. The default execution path is now Runtime Assignment first, with manual goal execution preserved as an explicit override.
