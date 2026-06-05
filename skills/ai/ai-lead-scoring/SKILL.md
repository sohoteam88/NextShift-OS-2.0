---
name: ai-lead-scoring
description: "Design AI lead scoring models, scoring signals, qualification rules, hot/warm/cold segments, explainable scores, and next-best-action recommendations. Use when a user needs AI-assisted lead prioritization for CRM, funnels, WhatsApp, email, or sales follow-up."
---

# AI Lead Scoring

## Mission

Use AI to prioritize leads and explain who to contact first, why, and what to do next.

## Operating Principles

- AI should reduce user effort, not add more decisions.
- Show what AI will do before it performs high-impact actions.
- Preserve user control with review, edit, approve, undo, and human handoff states.
- Keep outputs explainable and implementation-ready.
- Include guardrails, permissions, logging, and fallback states where relevant.
- Never expose API keys, secrets, or unsafe private data.
- Write in the user's language unless they request another language.

## Step 1: Collect Context

Collect:

- lead data
- conversion goal
- qualification criteria
- behavior signals
- source signals
- engagement signals
- sales outcomes

Ask concise questions only for missing high-impact details. If enough context exists, proceed directly and label assumptions.

## Step 2: Design AI Workflow

1. Define scoring signals and weights.
2. Create hot/warm/cold thresholds.
3. Generate explainable score reasons.
4. Map next-best-action by segment.
5. Define human review and feedback loop.

## Step 3: Output

Deliver:

- scoring model
- signal weights
- thresholds
- score explanation
- next-best-action
- CRM fields
- guardrails

End with the first AI implementation step.
