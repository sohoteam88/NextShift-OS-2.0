# EXEC-006 Multi-Mission Orchestration PRD

## Purpose

Coordinate multiple missions as one business outcome.

The AI COO should manage outcomes. Missions remain execution building blocks, and agent workforce plans remain mission-level execution details.

## Hierarchy

Business Outcome

Mission Program

Mission

Agent Workforce

Verification

## New Component

`OutcomeOrchestrator`

The orchestrator converts a desired business outcome into a mission chain with dependencies, unlock status, progress, and outcome-level verification.

## Contract

```ts
type BusinessOutcome = {
  id: string;
  templateId: OutcomeTemplateId;
  name: string;
  description: string;
  missions: MissionNode[];
  completionPercentage: number;
  status: 'PLANNED' | 'ACTIVE' | 'BLOCKED' | 'COMPLETED' | 'FAILED';
  currentMissionId?: string;
  nextMissionId?: string;
  blockedMissionIds: string[];
  requiredSignal: OutcomeSignal;
  verificationBoundary: 'outcome_completion_requires_missions_and_signal';
};

type MissionNode = {
  missionId: string;
  missionType: MissionType;
  name: string;
  route: string;
  dependsOn: string[];
  status: 'LOCKED' | 'ACTIVE' | 'BLOCKED' | 'COMPLETED' | 'FAILED';
  completionPercentage: number;
  workforcePlanId: string;
};
```

## Outcome Templates

- `FIRST_LEAD`: Lead Magnet -> Funnel -> Traffic, verified by `leadCount > 0`
- `FIRST_CUSTOMER`: Lead Magnet -> Funnel -> Traffic -> Customers, verified by `customerCount > 0`
- `FIRST_REVENUE`: Customers, verified by `revenue > 0`
- `RETENTION_SYSTEM`: Retention -> Content, verified by `retentionRate >= 20`
- `TEAM_SCALING`: Team, verified by `sopCount > 0`
- `AUTHORITY_BUILDING`: Content -> Lead Magnet, verified by `publishedContentCount >= 3`

## Dependency Rules

- Dependent missions remain `LOCKED` until every upstream mission is `COMPLETED`.
- The first unlocked incomplete mission becomes the current mission.
- The next locked mission is shown as the next mission.
- Mission completion is still signal-only and uses `MissionCompletionVerifier`.

## Outcome Verification

Mission completion is not outcome completion.

An outcome is complete only when:

- all required missions are completed
- the required outcome signal is verified

Example: `FIRST_LEAD` remains `BLOCKED` when all missions are complete but `leadCount` is `0`.

## Workspace Visibility

Mission Workspace includes an Outcome View showing:

- outcome progress
- mission chain
- current mission
- blocked missions
- next mission
- required outcome signal

Each mission still exposes its own Workforce Plan.

## Guardrails

Outcome Orchestrator may sequence and unlock missions.

Outcome Orchestrator may not:

- override mission verification
- override outcome verification
- override agent guardrails
- override business state

## Audit Events

- `outcome.created`
- `outcome.started`
- `outcome.progressed`
- `outcome.blocked`
- `outcome.completed`

Audit writes are deduped by outcome id, lifecycle status, and progress percentage.

## Acceptance

- Outcome Orchestrator exists.
- Mission dependencies exist.
- Outcome verification exists.
- Outcome workspace view exists.
- Mission unlocking exists.
- Audit logging exists.
- Type-check, targeted tests, and build must pass.
