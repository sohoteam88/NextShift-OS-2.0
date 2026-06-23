# EXEC-004 Autonomous Execution PRD

Version: V8  
Status: P0 Critical  
Owner: AI Workforce System

## Depends On

- EXEC-003 Autonomous Execution Guardrails
- EXEC-002A Real Agent Outputs
- HOTFIX-011 Signal-Only Verification
- COO-005 Mission Generator V2

## Mission

Allow AI agents to autonomously execute approved low-risk actions while preserving safety, auditability, verification integrity, and human control.

Autonomy is not "agent does everything." Autonomy means agents execute approved low-risk work while the user retains authority.

## Execution Hierarchy

```text
Mission
  -> Workspace
  -> Guardrail Engine
  -> Execution Decision
  -> Agent
  -> Execution Result
  -> Verification
```

## Level 4 Actions

Version 1 allows only low-risk autonomous actions:

- Generate weekly content drafts
- Generate content drafts
- Generate lead magnet drafts
- Generate funnel drafts
- Generate CRM follow-up drafts
- Generate offer drafts
- Generate internal reports
- Generate SOP drafts
- Generate meeting notes
- Refresh analytics summaries
- Generate opportunity reports

Rules:

- No external impact
- No customer impact
- No publishing
- No deployment
- No self-approval
- No verification or business state changes

## Autonomous Scheduler

The scheduler supports these trigger types:

- `scheduled`
- `mission`
- `event`
- `manual`

Pipeline:

```text
Trigger
  -> Guardrail Check
  -> Queue
  -> Agent
  -> Generate Asset or Internal Result
  -> Audit
  -> Workspace
```

Level 4 actions run automatically only when `AI_AUTONOMY_ENABLED` is not `false` and the guardrail decision allows autonomy.

## Execution Contract

```ts
interface AutonomousExecution {
  id: string;
  action: string;
  agent: string;
  executionLevel: number;
  triggerType: 'scheduled' | 'mission' | 'event' | 'manual';
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'BLOCKED' | 'CANCELLED';
  startedAt: string;
  completedAt: string | null;
}
```

## Approval Boundary

Human approval is required for publishing, activation, deployment, external communication, customer contact, and revenue actions.

Approval expiration remains 24 hours. Expired approvals are cancelled and must be re-requested.

## Workspace Integration

Mission Workspace should surface:

- Generated assets
- Execution history
- Agent activity
- Queue status

Generated assets from autonomous execution remain drafts until the user reviews and approves them.

## Audit Logging

Required audit actions:

- `agent.execution.queued`
- `agent.execution.started`
- `agent.execution.completed`
- `agent.execution.failed`
- `agent.execution.blocked`
- `agent.execution.cancelled`

Audit metadata stores execution ID, agent, action, trigger, risk, result, asset IDs, timestamps, execution level, and approval status.

## Verification Boundary

Autonomous execution is not mission completion.

Example: the Lead Magnet Agent can generate a draft, but MissionCompletionVerifier still requires real signals such as published lead magnet and active CTA.

## Acceptance Criteria

- Autonomous Scheduler exists.
- Queue exists.
- Execution history exists.
- Approval queue exists.
- Kill switch exists.
- Level 4 actions execute automatically.
- Level 3 actions require approval.
- Forbidden actions are blocked.
- Audit logging is complete.
- Type-check passes.
- Build passes.

## Final Principle

Autonomy is useful only when it is safe. Every autonomous action must be visible, auditable, traceable, and reversible.

The AI COO decides. Agents execute. The verifier confirms reality.
