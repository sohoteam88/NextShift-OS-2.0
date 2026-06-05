---
name: ai-coach
description: "Design proactive AI Coach experiences that guide users with today's goal, estimated time, next action, progress, encouragement, and completion prompts. Use when a user needs NextShift AI Coach behavior, task cards, missions, nudges, or coaching flows."
---

# AI Coach

## Mission

Make AI the proactive guide that tells users what to do next and helps them complete it.

## Operating Principles

- AI should reduce user effort, not add more decisions.
- Show what AI will do before it performs high-impact actions.
- Preserve user control with review, edit, approve, undo, and human handoff states.
- Keep outputs explainable and implementation-ready.
- Include guardrails, permissions, logging, and fallback states where relevant.
- Never expose API keys, secrets, or unsafe private data.
- Write in the user's language unless they request another language.
- For Malaysia-facing user experiences, support Chinese, English, and Bahasa Malaysia copy when requested or contextually useful.

## Step 1: Collect Context

Collect:

- user name
- user goal
- current progress
- next best action
- estimated time
- available tools
- review needs
- handoff destination

Ask concise questions only for missing high-impact details. If enough context exists, proceed directly and label assumptions.

## Step 2: Design AI Workflow

1. Define coach role and tone.
2. Create proactive mission card.
3. Design start, progress, review, complete, and next mission states.
4. Add nudge and fallback logic.
5. Specify implementation and analytics events.

## Step 3: Output

Deliver:

- AI Coach strategy
- task card
- conversation flow
- state machine
- nudge rules
- handoff logic
- implementation notes

End with the first AI implementation step.
