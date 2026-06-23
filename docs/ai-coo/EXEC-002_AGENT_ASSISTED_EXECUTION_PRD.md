# EXEC-002 Agent Assisted Execution PRD

Version: V8  
Status: P0 Critical  
Owner: AI COO System

## Depends On

- EXEC-001 Mission Execution Workspace
- COO-005 Mission Generator V2
- HOTFIX-011 Signal-Only Verification

## Mission

Allow AI agents to assist users in completing mission steps.

Agents do not determine missions. Agents help execute missions.

## Core Philosophy

AI COO decides what should be done. Users own execution. AI agents help with how the work gets done.

| Rule | Authority |
| --- | --- |
| Decision Authority | AI COO |
| Execution Authority | User |
| Execution Assistance | AI Agents |

## Architecture

```text
Business State
  -> Bottleneck
  -> Priority
  -> Mission
  -> Mission Workspace
  -> Agent Assistance
  -> Verification
  -> Mission Complete
```

## Agent Role

Agents are assistants, not managers or decision makers.

Agents may generate, suggest, create, analyze, draft, connect, and automate execution assets.

Agents may not override missions, skip verification, complete missions, change priority, write completion checks, write verification status, modify business state, modify bottleneck, modify priority, or modify mission.

## Agent Contract

```ts
interface ExecutionAgent {
  id: string;
  name: string;
  description: string;
  supportedMissionTypes: MissionType[];
  supportedSteps: string[];
  actions: ExecutionAgentAction[];
  status: 'IDLE' | 'WORKING' | 'COMPLETED' | 'FAILED';
}
```

## Initial Agent Set

- Content Agent: supports CONTENT; generates content, hooks, and repurposed content.
- Lead Magnet Agent: supports LEAD_MAGNET; suggests lead magnet types, drafts lead magnets, and generates CTA copy.
- Funnel Agent: supports LEAD_MAGNET and FUNNEL; creates landing pages, thank-you pages, and funnel reviews.
- Traffic Agent: supports TRAFFIC; recommends traffic sources, ad angles, and audiences.
- CRM Agent: supports CUSTOMERS and RETENTION; creates follow-up scripts, segmentation, and retention suggestions.
- Offer Agent: supports POSITIONING, CUSTOMERS, and OPTIMIZATION; reviews offers, improves offers, and analyzes objections.

## Workspace Panel

Location: Mission Workspace.

Display:

- Recommended Agent
- Available Agents
- Suggested Actions
- Generated Assets

Agent invocation is user controlled. No agent runs autonomously. A user clicks an agent action, the agent creates an execution asset, and the asset appears in the Mission Workspace.

## Generated Assets

Agents may create lead magnets, landing pages, content, offers, sales scripts, and traffic plans.

Generated assets appear in the Mission Workspace and are stored through audit metadata with:

- Agent Invoked
- Agent Output
- Generated Asset
- Execution Time

## Verification Boundary

Agent output is not mission completion.

Example: the Lead Magnet Agent can generate a lead magnet draft while the mission remains incomplete because the CTA is not connected or the asset is not published.

Verification remains signal-based and owned by MissionCompletionVerifier. Agent assistance never writes completion checks or verification status.

## Dashboard Rule

Dashboard may show recommended agent and agent status only.

Dashboard does not invoke agents, generate assets, or perform execution. Execution happens inside Mission Workspace.

## Success Metrics

- Agent Usage Rate target: 60%
- Mission Completion Rate target: 85%
- Agent Generated Asset Usage target: 70%
- Manual Work Reduction target: 50%

## Acceptance Criteria

- Agent panel exists.
- Agent recommendations exist.
- Generated assets appear in workspace.
- Verification remains signal-based.
- Agents cannot complete missions.
- Type-check passes.
- Build passes.

## Final Principle

The AI COO decides. The user owns execution. Agents accelerate execution. Trust is preserved because verification remains independent.
