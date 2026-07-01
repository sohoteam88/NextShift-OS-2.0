# NextShift UI Kit v1.0

# UK-008 Workspace Design Rules

**Execution Role:** Documentation Engineer  
**Assigned Agent:** Codex  
**Project:** NextShift UI Kit v1.0  
**Slice:** UK-008 Claude Design Brief  
**Lifecycle Phase:** Documentation Implementation  
**Inputs:** UK-008 Planning, UK-004 Workspace Layouts, UK-005 Interaction Patterns, UK-007 Workspace Branding  
**Outputs:** Workspace-aware design rules for AI-generated artifacts  
**Exit Criteria:** AI design output preserves shared Workspace architecture and avoids Workspace-specific forks

## Purpose

This document defines rules Claude Design must follow when generating Workspace-aware NextShift UI artifacts.

Workspace design rules protect the shared Workspace Shell, metadata-driven differences, and platform consistency across Retail, Recruitment, Admin, and future Workspaces.

## Core Workspace Rules

| Rule | Requirement |
| --- | --- |
| Shared shell | Use one Workspace Shell model across Workspaces. |
| Metadata differences | Workspace differences come from labels, modules, widgets, actions, imagery, and approved metadata. |
| Active context | Active Workspace identity remains visible. |
| Switcher distinction | Workspace switching is context change, not navigation. |
| No forks | Do not create Retail-only, Recruitment-only, or Admin-only component, layout, theme, or interaction systems. |
| State continuity | Loading, empty, error, selected, disabled, and success states preserve Workspace context. |

## Workspace Prompt Requirements

Claude Design prompts should include:

```text
Workspace:
Workspace type:
Active context:
Workspace-scoped action:
Workspace navigation:
Metadata-driven differences:
Shared shell requirement:
Anti-fork constraints:
```

## Dashboard Rules

- Lead with current operational state.
- Use KPI Cards, Dashboard Widgets, Chart Containers, Workspace Module Cards, and AI Recommendation Panels where relevant.
- Pair metrics with reasons and next actions.
- Preserve loading, empty, and error states.
- Do not let AI recommendations replace primary operational signals.

## Detail Rules

- Show entity identity and status first.
- Place the primary action near the summary.
- Keep supporting information below current decision context.
- Preserve Workspace identity for Workspace-scoped actions.
- Do not use branding or imagery to obscure object state.

## Form and Flow Rules

- Required fields and decisions come before optional sections.
- Validation appears near affected inputs or sections.
- Primary actions use outcome labels.
- Destructive or material actions require confirmation.
- Flow state includes entry, progression, completion, feedback, exit, and recovery.

## Workspace Branding Rules

- Workspace identity supports orientation.
- Brand accents do not override state or interaction meaning.
- Workspace-specific imagery must be paired with task or state guidance.
- Light and dark mode preserve the same Workspace meaning.

## AI Output Review

Reject AI-generated Workspace artifacts that:

- Fork the shell by Workspace type.
- Hardcode Retail or Recruitment as separate design systems.
- Hide Workspace identity.
- Treat Workspace switcher as a filter or tab.
- Omit state and recovery.
- Replace component guidance with decorative styling.

## Non-Goals

- No Workspace registry implementation.
- No runtime context logic.
- No routing rules.
- No database or capability workflow rules.
- No theme or component implementation.

## Status

Implemented.
