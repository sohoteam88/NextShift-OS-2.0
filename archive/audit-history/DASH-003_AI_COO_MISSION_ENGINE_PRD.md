# DASH-003_AI_COO_MISSION_ENGINE_PRD

Version: V8

Status: P0 Critical

Owner: NextShift OS

Depends On:

- DASH-001_AI_COO_FIRST_DASHBOARD_PHILOSOPHY
- DASH-002_REVISION_A
- ADR-006 Journey Engine
- ADR-008 AI Coach System

## Mission

Determine the single highest leverage action a user should execute right now.

The AI COO must answer:

- What should this user do next?
- Why?
- Why now?
- Why not something else?

## Core Philosophy

The AI COO never generates multiple missions.

The AI COO generates exactly one mission.

Rule:

- One user.
- One mission.
- One action.

## Mission Engine Architecture

Mission Engine:

- Business State Engine
- Bottleneck Engine
- Priority Engine
- Explainability Engine
- Mission Generator
- Routing Engine

## Business State Engine

Purpose: determine current business stage.

Input sources:

- AI Interview
- Journey Progress
- Content Activity
- Lead Activity
- Sales Activity
- Agent Activity
- Business Metrics

Output enum:

- BRAND_FOUNDATION
- BRAND_POSITIONING
- CONTENT_SYSTEM
- LEAD_MAGNET
- FUNNEL
- LEAD_GENERATION
- SALES
- TEAM_BUILDING

## Bottleneck Engine

Purpose: identify the biggest growth constraint.

Rule: the bottleneck is the first missing requirement preventing progress.

Output enum:

- NO_BRAND
- NO_POSITIONING
- NO_CONTENT
- NO_LEAD_MAGNET
- NO_FUNNEL
- NO_TRAFFIC
- NO_LEADS
- NO_APPOINTMENTS
- NO_CUSTOMERS
- NO_TEAM

Rule: only one bottleneck allowed.

## Priority Engine

Purpose: rank all possible actions and output a single priority action.

Priority rules:

- Fix bottleneck first.
- Never optimize before bottleneck removal.
- Never scale before validation.
- Never automate before process exists.

## Mission Generator

Output structure:

- Title
- Description
- Expected Outcome
- Estimated Time
- Mission Type
- Target Route

## Explainability Engine

Purpose: build trust.

Required output:

- Completed
- Current Gap
- Reasoning
- Expected Outcome

Rule: every mission must include reasoning. No reasoning means no mission.

## Routing Engine

Purpose: send user directly to execution.

Mission type mapping:

- CONTENT -> /content
- LEAD_MAGNET -> /lead-magnet
- FUNNEL -> /funnels
- TRAFFIC -> /traffic
- CUSTOMERS -> /customers
- TEAM -> /team

Rule: one click from mission to execution.

## Mission Lifecycle

- PENDING
- ACTIVE
- COMPLETED
- SKIPPED
- FAILED

## Daily Recalculation Rules

Mission recalculated when:

- Mission completed
- Journey updated
- New lead received
- New customer acquired
- Agent completed work
- User requests re-evaluation

Maximum automatic recalculation: once every 24 hours.

## New User Flow

If there is no AI Interview:

- Output: Start AI Interview
- Reason: Business profile unavailable.
- Route: /brand-builder/interview

This is the only valid mission.

## Error State

Mission Engine Failure

Display:

- We cannot determine your next mission.
- Continue through the Journey manually.
- Open Journey
- Retry Analysis

Never display:

- Blank state
- Loading forever
- Unknown mission

## Dashboard Output Contract

```ts
interface AICommandCenter {
  currentStage: string;
  missionTitle: string;
  missionDescription: string;
  reasoning: string;
  expectedOutcome: string;
  estimatedTime: string;
  route: string;
  priority: "Critical" | "High" | "Normal";
}
```

## Success Metrics

Mission Acceptance Rate:

- Target: 70%

Mission Completion Rate:

- Target: 60%

Time To First Action:

- Target: under 60 seconds
