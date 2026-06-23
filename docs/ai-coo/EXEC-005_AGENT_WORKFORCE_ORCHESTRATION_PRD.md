# EXEC-005 Agent Workforce Orchestration PRD

## Purpose

Coordinate multiple specialized agents for one mission without weakening mission verification.

Before this PRD, the workspace could invoke one assisted agent action and receive one generated asset. EXEC-005 adds a Workforce Orchestrator that plans the agent sequence, parallel branches, dependencies, and asset handoffs for the active Mission Plan.

## Contract

```ts
type WorkforcePlan = {
  missionId: string;
  missionType: MissionType;
  mode: 'sequential' | 'parallel' | 'hybrid';
  agents: WorkforcePlanAssignment[];
  dependencyGraph: WorkforceDependencyGraphNode[];
  currentAssignmentId?: string;
  verificationBoundary: 'workforce_completion_not_mission_completion';
};

type WorkforcePlanAssignment = {
  assignmentId: string;
  agentId: string;
  task: string;
  dependsOn: string[];
  executionLevel: ExecutionLevel;
  status: 'QUEUED' | 'READY' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'BLOCKED' | 'WAITING';
  outputAssetIds: string[];
  handoffFrom: string[];
  handoffTo: string[];
};
```

## Mission Mapping

- `LEAD_MAGNET`: Lead Magnet Agent -> Funnel Agent -> CRM Agent
- `CONTENT`: Content Agent -> Traffic Agent
- `FUNNEL`: Funnel Agent -> CRM Agent
- `CUSTOMERS`: Offer Agent -> CRM Agent
- `RETENTION`: CRM Agent -> Content Agent
- `TEAM`: Content Agent + CRM Agent -> SOP Generator Agent

Unmapped mission types fall back to COO Agent planning.

## Execution Rules

- Every assignment passes through the autonomous guardrail engine.
- Guardrails determine `executionLevel`; blocked guardrails produce `BLOCKED`.
- Dependencies consume `outputAssetIds`, not descriptions.
- A downstream assignment becomes `READY` only after upstream output assets exist.
- Workforce completion does not complete the mission.
- Mission completion remains owned by `MissionCompletionVerifier`.

## Workspace Visibility

Mission Workspace exposes a Workforce panel showing:

- agents
- assignment status
- dependency names
- output asset ids
- handoff asset ids
- current assignment
- orchestration mode

## Audit Events

The implementation reserves and writes these audit actions:

- `workforce.plan.created`
- `workforce.assignment.started`
- `workforce.assignment.completed`
- `workforce.assignment.failed`
- `workforce.assignment.blocked`
- `asset.handoff.completed`

Plan and handoff audits are deduped by mission or assignment target id.

## Acceptance

- Workforce Orchestrator exists.
- Sequential and parallel dependency modes are represented.
- Hybrid is the default for mixed dependency graphs.
- Dependency graph is explicit.
- Asset handoff is output-based.
- Workspace displays workforce status.
- Guardrails remain mandatory.
- Verification is independent from workforce state.
- Type-check, targeted tests, and build must pass.
