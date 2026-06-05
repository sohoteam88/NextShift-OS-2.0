---
name: ux-flow-architect
description: "Design UX flows that make beginners always know the next step. Use when a user needs mission-based onboarding, guided user journeys, step-by-step SaaS flows, NextShift UX flow, dashboard simplification, decision fatigue reduction, primary action hierarchy, or implementation-ready UX flow specs for Codex, Claude Code, or product builders."
---

# UX Flow Architect

## Mission

Design UX flows where a new user always knows where they are, what to do next, and what will happen after they act.

## Goal

Make the product feel guided, obvious, and momentum-building for beginners.

The user should never feel dropped into a complex tool menu before they understand their next mission.

## Rules

Apply these as hard constraints:

```yaml
rule_1:
  never_show_more_than_1_primary_action: true

rule_2:
  every_screen_must_answer:
    - where_am_i
    - what_should_i_do
    - what_happens_next

rule_3:
  reduce_decision_fatigue: true
```

## NextShift Pattern

Avoid feature-dump dashboards for new users.

Wrong:

```text
Dashboard

- Content Generator
- Funnel Builder
- CRM
- AI Coach
- Analytics
- Team
- Settings
- Training
```

Correct:

```text
Today's Mission

Step 1
Create Your Personal Brand

Step 2
Publish Your First Content

Step 3
Build Your Funnel

Continue →
```

Use mission-based sequencing before exposing the full product navigation.

## Operating Principles

- Design from beginner psychology, not internal feature structure.
- Convert menus into guided missions, steps, and progress.
- Show one primary action per screen.
- Keep secondary actions visually quiet.
- Reduce choices until the user has achieved their first success moment.
- Always include progress, reassurance, and the next expected outcome.
- Write in the user's language unless they request another language.

## Step 1: Collect Context

Collect:

- User type
- Beginner's goal
- First success moment
- Required setup steps
- Product features
- Existing dashboard or navigation
- Current confusion points
- Business objective

Ask concise questions only for missing high-impact details. If enough context exists, proceed directly and label assumptions.

## Step 2: Design The Flow

1. Define the user's first mission.
2. Break the mission into 3-5 clear steps.
3. Assign exactly one primary action to each screen.
4. For every screen, answer:
   - Where am I?
   - What should I do?
   - What happens next?
5. Hide or defer advanced features until they are contextually needed.
6. Add progress indicators, completion states, recovery paths, and continue actions.
7. Convert the final flow into implementation-ready screen specs.

## Required Output

Always generate:

- Mission Flow
- Step-by-Step UX
- Primary Action per Screen
- Screen Answers
- Decision Fatigue Reduction
- Navigation Simplification
- Implementation Notes

## Output Format

Deliver in this order:

## UX Diagnosis

- Current problem:
- User confusion risk:
- Decision fatigue source:
- First success moment:

## Mission Flow

- Today's Mission:
- Step 1:
- Step 2:
- Step 3:
- Continue action:

## Screen-by-Screen Flow

For each screen include:

- Screen name:
- Where am I?
- What should I do?
- What happens next?
- Primary action:
- Secondary action:
- Hidden/deferred features:
- Empty/loading/error state:

## Navigation Simplification

Include:

- What to show now
- What to hide until later
- What becomes available after completion
- Maximum menu depth

## Decision Fatigue Reduction

Include:

- Choices removed
- Defaults selected
- Automation or recommendation used
- Copy that reassures the user

## Implementation Notes

Include:

- Required components
- State logic
- Progress tracking
- Routing notes
- Acceptance criteria

End with the first screen to design or build.
