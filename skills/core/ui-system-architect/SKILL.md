---
name: ui-system-architect
description: "Architect complete UI visual systems for SaaS products, dashboards, admin panels, AI tools, and NextShift interfaces using simplicity-first references such as Linear, Stripe, and Notion. Use when a user needs Typography, Spacing, Grid System, Color System, Component Rules, visual standards, UI guidelines, design language, or implementation-ready frontend design rules."
---

# UI System Architect

## Mission

Establish the complete visual system for a product so Codex, Claude Code, designers, or frontend agents can build consistent, calm, premium, low-noise interfaces.

## References

Use these products as directional references:

- **Linear**: precise layout, restrained surfaces, crisp hierarchy, low visual noise.
- **Stripe**: polished SaaS clarity, strong typography, disciplined spacing, trustworthy interface rhythm.
- **Notion**: simplicity, flexible blocks, quiet UI, content-first interaction.

Do not copy these products. Use them as taste references for simplicity, whitespace, restraint, and system consistency.

## Rules

Apply these rules as hard constraints:

```yaml
simplicity_first: true
whitespace_priority: true
maximum_colors: 3
maximum_menu_depth: 2
avoid_visual_noise: true
```

Interpretation:

- Prefer fewer elements, fewer borders, fewer colors, and fewer competing controls.
- Give content and actions breathing room.
- Use a maximum of 3 core colors: neutral, primary, and semantic/accent.
- Keep navigation shallow: no more than 2 menu levels.
- Remove decorative clutter, oversized cards, unnecessary gradients, and repeated emphasis.

## Operating Principles

- Design the system before designing individual screens.
- Prioritize readability, hierarchy, whitespace, and predictable interaction.
- Use restrained SaaS/product UI patterns over marketing-style decoration.
- Define rules that can be implemented in CSS, Tailwind, tokens, or component libraries.
- Include mobile and desktop behavior when layout rules depend on viewport.
- Flag assumptions when context is missing.
- Write in the user's language unless they request another language.

## Step 1: Collect Context

Collect:

- Product type
- Target users
- Main workflows
- Brand personality
- Existing stack or UI library
- Screen types: dashboard, admin, funnel, onboarding, AI assistant, mobile, or mixed
- Accessibility or platform constraints

Ask concise questions only for missing high-impact details. If enough context exists, proceed directly and label assumptions.

## Step 2: Create Visual System

Define:

1. Typography hierarchy for product UI.
2. Spacing scale and density rules.
3. Grid system for desktop, tablet, and mobile.
4. Color system with no more than 3 core colors.
5. Component rules for buttons, inputs, cards, tables, navigation, modals, panels, empty states, and alerts.
6. Visual hierarchy rules for emphasis, grouping, and scanning.
7. Implementation notes for frontend agents.

## Required Output

Always generate:

- Typography
- Spacing
- Grid System
- Color System
- Component Rules

## Output Format

Deliver in this order:

## Visual Direction

- Reference style:
- Product personality:
- UI principles:
- What to avoid:

## Typography

Include:

- Font direction
- Type scale
- Heading rules
- Body text rules
- Label and caption rules
- Line-height rules
- Weight rules

## Spacing

Include:

- Base spacing unit
- Section spacing
- Component spacing
- Form spacing
- Table/list density
- Mobile spacing adjustments

## Grid System

Include:

- Desktop grid
- Tablet grid
- Mobile grid
- Max content width
- Sidebar/content behavior
- Dashboard layout rules

## Color System

Use a maximum of 3 core colors:

- Neutral color:
- Primary color:
- Semantic/accent color:

Include:

- Backgrounds
- Text colors
- Borders
- Interactive states
- Success/warning/error treatment if needed

## Component Rules

Include rules for:

- Buttons
- Inputs
- Cards
- Tables
- Navigation
- Modals/drawers
- Tabs
- Filters
- Empty states
- Alerts/toasts

## Implementation Notes

Include:

- CSS/token recommendations
- Tailwind-style token examples if useful
- Responsive rules
- Accessibility reminders
- Design QA checklist

End with the first UI system decision to lock before implementation.
