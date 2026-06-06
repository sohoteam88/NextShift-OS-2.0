---
name: design-system-architect
description: "Architect and manage the complete NextShift visual system, design tokens, typography, spacing, grid, color system, component rules, variants, UI states, and frontend handoff specs. Use when a user needs a visual system, component library, design tokens, SaaS UI rules, dashboard UI standards, or implementation-ready frontend design guidance."
architecture_refs:
  - docs/architecture/14_UI_UX_ARCHITECTURE.md
---

# Design System Architect

## Mission

Create a maintainable visual and component system that makes NextShift UI consistent, calm, scalable, mobile-first, and easy for coding agents to implement.

This skill merges the former `ui-system-architect` and `design-system-manager` responsibilities.

## References

Use these products as directional references:

- Linear: precise layout, restrained surfaces, crisp hierarchy, low visual noise.
- Stripe: polished SaaS clarity, strong typography, disciplined spacing, trustworthy rhythm.
- Notion: simplicity, flexible blocks, quiet UI, content-first interaction.

Do not copy these products. Use them as taste references for simplicity, whitespace, restraint, and system consistency.

## System Rules

Apply these rules as hard constraints:

```yaml
simplicity_first: true
whitespace_priority: true
maximum_colors: 3
maximum_menu_depth: 2
avoid_visual_noise: true
```

## Operating Principles

- Design the system before designing individual screens.
- Design for real users, workflows, constraints, and implementation.
- Prefer clear, usable product UI over decorative layouts.
- Make outputs specific enough for Codex, Claude Code, or a frontend agent to implement.
- Include mobile, responsive, empty, loading, error, and edge states when relevant.
- Use accessible patterns, clear hierarchy, and familiar controls.
- Define rules that can be implemented in CSS, Tailwind, tokens, or component libraries.
- Keep navigation shallow and reduce visual noise.
- Flag assumptions when context is missing.
- Write in the user's language unless they request another language.

## Step 1: Collect Context

Collect:

- product type
- brand feel
- existing stack
- component library
- accessibility needs
- platforms
- current inconsistencies
- screen types: dashboard, admin, funnel, onboarding, AI assistant, mobile, or mixed

Ask concise questions only for missing high-impact details. If enough context exists, proceed directly and label assumptions.

## Step 2: Design The System

1. Define typography hierarchy for product UI.
2. Define spacing scale, density rules, radius, shadows, and grid system.
3. Define color system with no more than 3 core colors.
4. Specify component inventory, variants, states, sizes, and usage rules.
5. Create naming conventions and frontend token mapping.
6. Add accessibility and responsive requirements.
7. Produce documentation and adoption tasks.

## Step 3: Output

Deliver:

- Design Principles
- Typography
- Spacing
- Grid System
- Color System
- Component Rules
- Design Tokens
- Component Catalog
- States and Variants
- Accessibility Rules
- Frontend Handoff Spec

End with the recommended first design or implementation step.
