# EXEC-003 Autonomous Execution Guardrails PRD

Version: V8  
Status: P0 Critical  
Owner: AI COO System

## Depends On

- EXEC-001 Mission Execution Workspace
- EXEC-002 Agent Assisted Execution
- COO-005 Mission Generator V2
- HOTFIX-011 Signal-Only Verification

## Mission

Define what AI agents may do autonomously, what requires user approval, and what is permanently forbidden.

Guardrails are not designed to make agents more powerful. Guardrails keep agents safe.

## Core Philosophy

Capability without boundaries creates risk. Boundaries come before autonomy.

The AI COO decides. The user owns the business. Agents assist execution. Agents never gain authority by default.

## Decision Hierarchy

```text
AI COO
  -> Mission
  -> Guardrail Engine
  -> Execution Permission
  -> Agent
  -> Action
```

## Execution Levels

| Level | Name | Purpose |
| --- | --- | --- |
| 0 | READ_ONLY | Observe, analyze, recommend |
| 1 | GENERATE | Create drafts without changing live business state |
| 2 | PREPARE | Prepare actions but do not execute them |
| 3 | APPROVAL_REQUIRED | Actions affecting live systems |
| 4 | AUTONOMOUS | Low-risk repetitive actions, only when explicitly enabled |
| 5 | FORBIDDEN | Never allowed |

## Risk Classes

| Risk | Examples | Default Level |
| --- | --- | --- |
| LOW | Generate notes, content ideas, internal reports | AUTONOMOUS |
| MEDIUM | Create asset, create funnel draft, create lead magnet | GENERATE |
| HIGH | Publish, deploy, send, activate | APPROVAL_REQUIRED |
| CRITICAL | Delete, override, modify verification, modify revenue | FORBIDDEN |

## Approval Engine

Approval requests must include:

- Action
- Agent
- Risk
- Expected outcome
- Affected resources

Approval actions:

- Approve
- Reject
- Modify

Default approval expiration is 24 hours. Expired approvals must be re-requested before execution.

## Autonomous Policy Contract

```ts
interface AutonomousPolicy {
  action: string;
  risk: RiskClass;
  executionLevel: ExecutionLevel;
  approvalRequired: boolean;
}
```

## Agent Capability Contract

```ts
interface AgentCapability {
  action: string;
  executionLevel: ExecutionLevel;
}
```

## Workspace Integration

```text
Mission Workspace
  -> Agent Action
  -> Guardrail Check
  -> Execute or Approval Request or Reject
```

Agent actions are checked before execution. Generated assets remain assistance output and do not complete missions.

## Audit Logging

Every execution action stores:

- Agent action
- Execution level
- Approval status
- Approver
- Timestamp
- Affected assets

Audit actions include:

- `agent.action.executed`
- `agent.action.rejected`
- `agent.action.approved`
- `agent.action.blocked`

## Forbidden Actions

Agents may never override verification, mission completion, business state, bottleneck, priority, explainability, or the mission generator.

Agents may never delete customer data, business assets, funnels, CRM records, revenue records, or mission history.

## Emergency Kill Switch

`AI_AUTONOMY_ENABLED=false` disables all Level 4 autonomous actions. When the kill switch is off, autonomous actions are blocked instead of queued for execution.

## Compliance Rules

Every action must answer:

- Who requested it?
- Who approved it?
- What changed?
- Can it be audited?

If any answer is missing, the action is blocked.

## Acceptance Criteria

- Execution levels implemented.
- Risk classes implemented.
- Approval engine implemented.
- Guardrail checks enforced.
- Audit logs generated.
- Kill switch exists.
- Forbidden actions blocked.
- Type-check passes.
- Build passes.

## Final Principle

Autonomy is earned, not granted. Every autonomous action must be visible, auditable, reversible, and safe.

The AI COO owns decisions. The user owns authority. Agents operate inside guardrails.
