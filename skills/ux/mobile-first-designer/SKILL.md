---
name: mobile-first-designer
description: "Design mobile-first UX for Malaysia-heavy audiences where 70%-90% of users may come from phones. Use when a user needs mobile-first SaaS, funnel, onboarding, dashboard, WhatsApp, health, creator, or NextShift UI with thumb-zone optimization, bottom sticky CTA, responsive rules, and desktop-after-mobile design."
---

# Mobile First Designer

## Mission

Design the mobile experience first because the majority of users may arrive from phones, especially in Malaysia-focused NextShift funnels, dashboards, onboarding, and WhatsApp-driven flows.

## Market Assumption

For Malaysia-facing products, assume:

```text
70%-90% of users may come from mobile
```

This means the mobile experience is the primary product experience. Desktop is an adaptation after mobile is clear.

## Rules

Apply these as hard constraints:

```yaml
design_for_mobile_first: true
desktop_after_mobile: true
thumb_zone_optimized: true
```

## CTA Rule

Use:

```text
Bottom Sticky CTA
```

The primary action should remain easy to reach with the thumb, especially on long pages, onboarding flows, lead forms, funnel pages, and consultation flows.

## Operating Principles

- Design mobile screens before desktop screens.
- Put the primary action in the thumb-friendly lower zone.
- Avoid dense dashboards, tiny tables, multi-column layouts, and desktop-first navigation on mobile.
- Keep text short, sections stacked, forms simple, and actions obvious.
- Use bottom sheets, segmented steps, accordions, and sticky CTAs where they reduce friction.
- Make desktop expand the mobile logic instead of replacing it with a different experience.
- Write in the user's language unless they request another language.

## Step 1: Collect Context

Collect:

- User type
- Main mobile task
- Page or flow type
- Primary CTA
- Content sections
- Form fields
- Navigation needs
- WhatsApp or consultation handoff if relevant
- Desktop requirements
- Device/browser constraints if known

Ask concise questions only for missing high-impact details. If enough context exists, proceed directly and label assumptions.

## Step 2: Design Mobile First

1. Define the mobile user's main task and one primary CTA.
2. Create the mobile screen order from top to bottom.
3. Place the primary CTA in a bottom sticky CTA when appropriate.
4. Optimize for thumb zone, tap targets, readable text, and one-column scanning.
5. Simplify forms, tables, menus, filters, and modals for mobile.
6. Define desktop adaptation after the mobile experience works.
7. Add mobile QA rules and implementation notes.

## Required Output

Always generate:

- Mobile-First Strategy
- Mobile Screen Layout
- Thumb Zone Optimization
- Bottom Sticky CTA
- Desktop Adaptation
- Responsive Rules
- Mobile QA Checklist

## Output Format

Deliver in this order:

## Mobile-First Strategy

- Audience:
- Mobile assumption:
- Main task:
- Primary CTA:
- First success moment:

## Mobile Screen Layout

Include:

- First viewport:
- Section order:
- Navigation:
- Content grouping:
- Form behavior:
- Bottom sticky CTA:
- Completion state:

## Thumb Zone Optimization

Include:

- Primary action placement:
- Secondary action placement:
- Tap target rules:
- One-handed use notes:
- Risk areas to avoid:

## Bottom Sticky CTA

Include:

- CTA text:
- Sticky behavior:
- When it appears:
- When it hides:
- Safe-area handling:
- Secondary CTA, if any:

## Desktop Adaptation

Include:

- What expands:
- What stays the same:
- What moves to sidebar/header:
- Desktop CTA placement:
- Desktop layout grid:

## Responsive Rules

Include:

- Mobile:
- Tablet:
- Desktop:
- Tables/lists:
- Modals/sheets:
- Forms:

## Mobile QA Checklist

Check:

- CTA reachable by thumb
- Text readable without zoom
- No horizontal scroll
- Forms easy to complete
- Sticky CTA does not cover content
- Tap targets are large enough
- Loading/error/empty states work on small screens

End with the first mobile screen to design or build.
