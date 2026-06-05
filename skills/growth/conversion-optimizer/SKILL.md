---
name: conversion-optimizer
description: "Audit and optimize funnel conversion with a 0-100 Conversion Score. Use when a user needs funnel CRO, landing page review, headline strength scoring, CTA visibility audit, form length reduction, social proof review, trust elements, conversion diagnosis, or prioritized funnel fixes."
---

# Conversion Optimizer

## Mission

Evaluate funnel pages and flows, score their conversion readiness from 0-100, and provide prioritized fixes that improve clarity, trust, action visibility, and lead capture.

## Scope

This skill is focused on funnels:

- Landing pages
- Lead magnet pages
- Quiz funnels
- Webinar registration pages
- Application forms
- Consultation booking pages
- Checkout or payment-intent pages
- WhatsApp handoff pages

## Required Checks

Always inspect:

- headline_strength
- cta_visibility
- form_length
- social_proof
- trust_elements

## Conversion Score

Always generate:

```text
Conversion Score: 0-100
```

Use this scoring model:

```yaml
headline_strength: 20
cta_visibility: 20
form_length: 20
social_proof: 20
trust_elements: 20
```

Deduct points for weak clarity, hidden actions, long or confusing forms, missing proof, missing credibility, distracting layout, or unclear next step.

## Operating Principles

- Score honestly and explain every deduction.
- Prioritize fixes that increase qualified conversions, not just clicks.
- Make the CTA obvious on mobile and desktop.
- Reduce form friction unless extra fields are needed for qualification.
- Use social proof and trust elements before high-friction actions.
- Avoid fake proof, fake urgency, and manipulative pressure.
- Write in the user's language unless they request another language.

## Step 1: Collect Context

Collect:

- Funnel type
- Page or flow goal
- Target audience
- Offer or lead magnet
- Current page copy or screenshot if available
- Form fields
- CTA text and placement
- Social proof available
- Trust elements available
- Traffic source

Ask concise questions only for missing high-impact details. If enough context exists, proceed directly and label assumptions.

## Step 2: Audit Funnel

1. Score headline strength.
2. Score CTA visibility.
3. Score form length and friction.
4. Score social proof.
5. Score trust elements.
6. Calculate total Conversion Score from 0-100.
7. Identify highest-impact fixes.
8. Provide revised copy or UI recommendations where useful.

## Required Output

Always generate:

- Conversion Score
- headline_strength
- cta_visibility
- form_length
- social_proof
- trust_elements
- Priority Fixes
- Revised Recommendations

## Output Format

Deliver in this order:

## Conversion Score

- Total score: /100
- Grade:
- Main bottleneck:
- Highest-impact fix:

## Score Breakdown

For each item include score, diagnosis, deduction reason, and fix:

- headline_strength: /20
- cta_visibility: /20
- form_length: /20
- social_proof: /20
- trust_elements: /20

## Funnel Diagnosis

Include:

- What is working:
- What is unclear:
- What creates friction:
- What reduces trust:
- What weakens the CTA:

## Priority Fixes

Rank fixes by impact:

1. Highest impact:
2. Medium impact:
3. Quick win:

## Revised Recommendations

Include:

- Stronger headline:
- Stronger CTA:
- Shorter form:
- Social proof placement:
- Trust element placement:

## Testing Plan

Include:

- A/B test idea:
- Metric to track:
- Expected improvement:
- Implementation effort:

End with the first conversion fix to make.
