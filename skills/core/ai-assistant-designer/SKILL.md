---
name: ai-assistant-designer
description: "Design NextShift AI Coach experiences where AI proactively guides users instead of making users search for features. Use when a user needs proactive AI assistant UX, AI Coach task cards, mission guidance, conversational onboarding, agent-led workflows, suggested actions, time estimates, start prompts, progress coaching, or implementation-ready AI assistant design."
---

# AI Assistant Designer

## Mission

Design the NextShift AI Coach experience: an assistant that proactively guides the user toward the next best action instead of waiting for the user to find features.

## Differentiation

Traditional SaaS:

```text
User searches for features.
```

NextShift:

```text
AI proactively guides the user.
```

The AI Coach should feel like a calm operator that knows the user's goal, current progress, and next mission.

## AI Coach Pattern

Use this default pattern:

```text
AI Coach:

Steven,

Today's goal:

Publish 1 content piece

Estimated time:

15 minutes

Start?
```

Adapt the name, goal, and time estimate to the user's context.

## Operating Principles

- AI should recommend the next best action, not show a list of all possible features.
- Every AI prompt should include a clear goal, reason, estimated time, and next action.
- Keep AI Coach copy short, warm, and action-oriented.
- Make the primary action obvious: Start, Continue, Review, Approve, Publish, Send, or Book.
- Let users decline, postpone, or change the mission without friction.
- Show what the AI will do before it does it when actions affect user content, leads, customers, or money.
- Preserve user control with review, edit, undo, and confirmation states.
- Write in the user's language unless they request another language.

## Step 1: Collect Context

Collect:

- User name
- User goal
- Current progress
- Next best action
- Estimated time
- Data/tools the AI can access
- Actions the AI can perform
- Review or approval requirements
- Risk level
- Handoff destination: content, funnel, WhatsApp, dashboard, CRM, calendar, or sales call

Ask concise questions only for missing high-impact details. If enough context exists, proceed directly and label assumptions.

## Step 2: Design AI Coach Experience

1. Define the AI Coach role and boundaries.
2. Identify the user's next best mission.
3. Design the proactive task card with goal, time estimate, and Start CTA.
4. Design the guided flow after Start: interview, generate, review, launch, continue.
5. Define states: idle, suggested, started, generating, waiting for review, completed, postponed, failed.
6. Specify tool-use transparency: what AI is doing, what data it uses, and what requires confirmation.
7. Create implementation-ready UI and agent flow specs.

## Required Output

Always generate:

- AI Coach Role
- Proactive Task Card
- Suggested Action
- Estimated Time
- Start Flow
- Review/Approval Flow
- AI Agent Flow
- UI States
- Implementation Notes

## Output Format

Deliver in this order:

## AI Coach Strategy

- User:
- Current goal:
- Current progress:
- Next best action:
- Why this action:
- Estimated time:

## Proactive Task Card

Include:

- Greeting:
- Today's goal:
- Estimated time:
- Primary CTA:
- Secondary action:
- Postpone/change option:

Example style:

```text
Steven,

Today's goal:
Publish 1 content piece

Estimated time:
15 minutes

Start?
```

## Conversation Flow

Include:

- Opening message:
- Clarifying question:
- AI action preview:
- User confirmation:
- Progress update:
- Review prompt:
- Completion message:
- Next mission:

## Start Flow

Include:

- What happens when user taps Start:
- Data AI collects:
- Asset AI generates:
- Review screen:
- Launch action:
- Continue action:

## Review / Approval Flow

Include:

- What user can edit:
- What requires confirmation:
- Undo option:
- Regenerate option:
- Approval CTA:

## AI Agent Flow

Include:

- Trigger:
- Inputs:
- Tools/data access:
- Steps:
- Output:
- Human review point:
- Logs/observability:
- Guardrails:

## UI States

Include:

- Idle:
- Suggested action:
- In progress:
- Waiting for user:
- Completed:
- Postponed:
- Error/fallback:

## Implementation Notes

Include:

- Components:
- Data model:
- Agent state machine:
- Permissions:
- Events/analytics:
- Acceptance criteria:

End with the first AI Coach card to build.
