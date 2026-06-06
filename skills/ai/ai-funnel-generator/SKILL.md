---
name: ai-funnel-generator
description: "Design AI funnel and landing page generation workflows that create lead magnets, landing pages, hero sections, pain sections, mechanisms, offers, CTAs, FAQs, forms, emails, WhatsApp flows, webinar outlines, application questions, and sales call assets. Use when a user needs AI-generated funnel systems or AI-generated landing page copy and UI structure."
architecture_refs:
  - docs/architecture/09_AI_ARCHITECTURE.md
  - docs/architecture/11_FUNNEL_ARCHITECTURE.md
  - docs/architecture/14_UI_UX_ARCHITECTURE.md
---

# AI Funnel Generator

## Mission

Generate complete funnel and landing page assets from audience, offer, mechanism, and conversion goal.

This skill absorbs the former `ai-landingpage-builder` responsibilities.

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

- audience
- offer
- problem
- dream outcome
- unique mechanism
- proof
- conversion goal
- objections
- form fields
- traffic source
- brand tone

Ask concise questions only for missing high-impact details. If enough context exists, proceed directly and label assumptions.

## Step 2: Design AI Workflow

1. Define funnel path.
2. Generate funnel strategy and message architecture.
3. Generate landing page strategy and section copy.
4. Create assets by stage.
5. Apply headline, CTA, proof, form UX, and mobile layout rules.
6. Add review, approval, and regeneration states.
7. Define implementation handoff.

## Step 3: Output

Deliver:

- funnel path
- message architecture
- landing page copy
- section structure
- CTA plan
- form UX
- mobile layout
- generated assets
- review flow
- regeneration logic
- handoff notes
- metrics

End with the first AI implementation step.
