# NextShift UI Kit v1.0

# UK-008 Claude Design Brief

**Execution Role:** Documentation Engineer  
**Assigned Agent:** Codex  
**Project:** NextShift UI Kit v1.0  
**Slice:** UK-008 Claude Design Brief  
**Lifecycle Phase:** Documentation Implementation  
**Inputs:** UK-008 Planning, UK-008 Documentation Implementation Contract, STD-001 through STD-004, UK-001 through UK-007, NextShift Design System v1.0  
**Outputs:** Definitive Claude Design brief guidance for UI Kit-aligned design generation  
**Exit Criteria:** Claude Design guidance is Workspace-aware, implementation-independent, and ready for Requirements Verification

## Purpose

This document defines the authoritative operating brief for Claude Design and future AI Design Agents generating NextShift UI artifacts.

The brief instructs AI systems how to load context, construct prompts, choose components, choose layouts, apply interaction, accessibility, theme, and branding rules, and review generated design artifacts. It does not instruct AI systems to generate runtime code, CSS, design tokens, routes, API contracts, data models, or new Design System components.

## Authority Stack

Every Claude Design brief must declare:

```text
Design authority: NextShift Design System v1.0
Language authority: NextShift UI Kit v1.0
Slice authority: UK-008 Claude Design Brief
Business authority: [capability or Workspace source, when applicable]
```

Authority statements prevent AI-generated outputs from redefining implementation primitives or inventing local design systems.

## Required Prompt Skeleton

Use this skeleton for AI design generation:

```text
Project: NextShift OS 3.1
Design authority: NextShift Design System v1.0
Language authority: NextShift UI Kit v1.0
Surface type:
Workspace context:
User goal:
Business context:
Required template:
Required components:
Required interaction pattern:
Required states:
Accessibility constraints:
Theme and branding constraints:
Output artifact:
Anti-patterns to avoid:
Do not generate runtime code, CSS, tokens, API behavior, database behavior, routes, or new components.
```

## Required Context

Claude Design must receive:

1. Surface type: Workspace, Dashboard, View, Flow, Pattern, Panel, Card, Widget, or Module.
2. Active Workspace context: Retail, Recruitment, Admin, or future Workspace.
3. Member goal: what the user needs to understand, decide, or do.
4. Data state: populated, loading, empty, error, success, warning, disabled, selected, expanded, or blocked.
5. Design constraints: components, layout, interaction, accessibility, and theme boundaries.
6. Output type: design brief, screen specification, component composition, QA checklist, or review notes.

## Claude Design Output Requirements

Generated artifacts should include:

- Approved UI Kit terminology.
- Workspace context and view purpose.
- Component names from UK-003 or Design System language.
- Layout template from UK-004.
- Interaction and feedback expectations from UK-005.
- Accessibility expectations from UK-006.
- Theme and branding constraints from UK-007.
- Required states and recovery paths.
- Anti-patterns to avoid.
- Explicit note that implementation remains owned by the Design System and application layer.

## Generation Rules

- Use approved terms exactly.
- Use shared Workspace models; do not fork Retail, Recruitment, Admin, or future Workspaces.
- Prefer component composition over inventing new components.
- Include loading, empty, error, success, disabled, selected, and expanded states where applicable.
- Name actions by outcome.
- Keep one primary action per card, panel, section, or view region.
- Preserve accessibility, non-color state communication, and responsive continuity.
- Apply theme and brand as context, not decoration.

## Review Rules

Generated artifacts are acceptable only when:

- They preserve Design System authority.
- They reuse UI Kit slices UK-001 through UK-007.
- They are implementation-independent.
- They avoid runtime assumptions.
- They are reviewable by humans and AI agents.

## Non-Goals

- No runtime implementation.
- No React, Vue, CSS, Storybook, or token output.
- No component redesign.
- No API, database, routing, or governance design.
- No visual-system invention.

## Status

Implemented.
