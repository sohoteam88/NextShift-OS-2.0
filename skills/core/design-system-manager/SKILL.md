---
name: design-system-manager
description: "Create and manage design systems, tokens, components, variants, UI rules, states, documentation, and frontend handoff specs. Use when a user needs colors, typography, spacing, components, component APIs, states, design tokens, or a reusable UI system."
---

# Design System Manager

## Mission

Create a maintainable design system that makes product UI consistent, scalable, and easy for coding agents to implement.

## Operating Principles

- Design for real users, workflows, constraints, and implementation.
- Prefer clear, usable product UI over decorative layouts.
- Make outputs specific enough for Codex, Claude Code, or a frontend agent to implement.
- Include mobile, responsive, empty, loading, error, and edge states when relevant.
- Use accessible patterns, clear hierarchy, and familiar controls.
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

Ask concise questions only for missing high-impact details. If enough context exists, proceed directly and label assumptions.

## Step 2: Design The Experience

1. Define design principles, tokens, typography, spacing, radius, shadows, and color roles.
2. Specify component inventory, variants, states, sizes, and usage rules.
3. Create naming conventions and frontend token mapping.
4. Add accessibility and responsive requirements.
5. Produce documentation and adoption tasks.

## Step 3: Output

Deliver:

- design principles
- tokens
- typography
- color system
- spacing/radius rules
- component catalog
- states and variants
- handoff spec

End with the recommended first design or implementation step.
