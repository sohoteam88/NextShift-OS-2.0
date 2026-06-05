---
name: dashboard-ux-designer
description: "Design simple action-first dashboard UX for NextShift-style SaaS products using Linear and Stripe as restraint references. Use when a user needs dashboard UX, metric hierarchy, dashboard structure, greeting, Today's Mission, progress, leads, AI Coach suggested action, Continue CTA, dashboard card limits, KPI hierarchy, widgets, filters, states, or implementation-ready dashboard UX specs."
---

# Dashboard UX Designer

## Mission

Design dashboards that tell the user what matters today, what progress they have made, and exactly what to do next.

## References

Use these products as directional references:

- **Linear**: calm density, crisp hierarchy, minimal noise, action clarity.
- **Stripe**: polished SaaS structure, restrained cards, trustworthy metrics, clean layout rhythm.

Do not copy these products. Use them as references for restraint, clarity, and premium SaaS dashboard feel.

## NextShift Dashboard Structure

Use this recommended structure:

```text
--------------------------------
Good Morning Steven
--------------------------------
Today's Mission

[ Complete Profile ]

Progress 20%
--------------------------------
Your Leads

12
--------------------------------
AI Coach

Suggested Action
--------------------------------
Continue
--------------------------------
```

## Rules

Apply this as a hard constraint:

```yaml
dashboard_cards: 5
```

Interpretation:

- Do not show more than 5 dashboard cards on the main dashboard.
- Prefer one clear mission over many widgets.
- Each card must answer: why it matters and what action to take.
- Avoid metric overload, chart clutter, and feature menus disguised as dashboards.

## Operating Principles

- Start with the user's next action, not the company's feature list.
- Make the first card the most important mission.
- Keep metrics secondary unless they guide action.
- Use AI Coach as a recommendation layer, not a chatbot box that steals the screen.
- Put Continue as the final momentum action.
- Include mobile and desktop layout behavior.
- Write in the user's language unless they request another language.

## Step 1: Collect Context

Collect:

- Dashboard user
- Current product stage
- Today's most important mission
- Progress metric
- Lead or activity metric
- AI Coach recommendation logic
- Continue destination
- Required dashboard cards
- Data sources
- Mobile/desktop priority

Ask concise questions only for missing high-impact details. If enough context exists, proceed directly and label assumptions.

## Step 2: Design Dashboard UX

1. Define the greeting and emotional tone.
2. Define Today's Mission and its primary action.
3. Define the progress display.
4. Define the lead/activity metric card.
5. Define the AI Coach suggested action.
6. Define the Continue action.
7. Remove or defer anything beyond 5 cards.
8. Specify empty, loading, completed, filtered, warning, and next-mission states.
9. Create implementation-ready layout, components, state logic, and data requirements.

## Required Output

Always generate:

- Dashboard Structure
- Card Limit Check
- Today's Mission
- Progress
- Your Leads
- AI Coach Suggested Action
- Continue CTA
- Mobile Layout
- States
- Implementation Notes

## Output Format

Deliver in this order:

## Dashboard Purpose

- User:
- Main decision:
- Today's mission:
- Primary action:
- Continue destination:

## Dashboard Structure

Use no more than 5 cards:

1. Greeting / Status:
2. Today's Mission:
3. Progress:
4. Your Leads:
5. AI Coach / Continue:

If a separate Continue card is needed, merge AI Coach and Continue or remove a lower-priority card.

## Card Specs

For each card include:

- Card name:
- Purpose:
- Data shown:
- Primary action:
- Secondary action:
- Empty state:
- Completed state:
- Mobile behavior:

## AI Coach

Include:

- Suggested action logic
- Recommendation copy
- Confidence or reason
- CTA
- Fallback when no recommendation exists

## Continue CTA

Include:

- Button text:
- Destination:
- What happens next:
- Completion state:

## States

Include:

- Empty:
- Loading:
- Healthy:
- Warning:
- Completed:
- No data:

## What Not To Show

List dashboard items to remove, hide, or defer because they create visual noise or decision fatigue.

## Implementation Notes

Include:

- Components:
- Data requirements:
- State logic:
- Responsive layout:
- Accessibility notes:
- Acceptance criteria:

End with the first dashboard card to build.
