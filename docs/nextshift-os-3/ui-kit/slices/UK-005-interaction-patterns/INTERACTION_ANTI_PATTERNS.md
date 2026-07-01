# NextShift UI Kit v1.0

# UK-005 Interaction Anti-Patterns

**Execution Role:** Documentation Engineer  
**Assigned Agent:** Codex  
**Project:** NextShift UI Kit v1.0  
**Slice:** UK-005 Interaction Patterns  
**Lifecycle Phase:** Documentation Implementation  
**Inputs:** UK-005 Planning, UK-002 Anti-Patterns, UK-003 Component Composition Rules, UK-004 Layout Anti-Patterns  
**Outputs:** Interaction approaches to avoid in Workspace-aware surfaces  
**Exit Criteria:** Anti-patterns protect clarity, trust, recoverability, Workspace consistency, and Design System boundaries

## Purpose

This document identifies interaction approaches that should be avoided in NextShift Workspace interfaces.

Anti-patterns protect consistency, member trust, AI-assisted design quality, and shared Workspace scalability.

## Hidden Primary Action

Anti-pattern:

- Placing the only primary action inside a menu, collapsed region, or unrelated panel.

Why it fails:

- Breaks Decision-First UX.
- Makes the intended next action unclear.
- Produces inconsistent AI-generated surfaces.

Preferred approach:

- Expose the primary action near the decision it completes.

## Competing Primary Actions

Anti-pattern:

- Presenting multiple dominant actions in one card, panel, section, or view region.

Why it fails:

- Weakens priority.
- Increases operational error.
- Conflicts with UK-003 composition rules.

Preferred approach:

- Use one primary action per unit and subordinate other actions.

## Vague Action Labels

Anti-pattern:

- Using generic action labels such as `Submit`, `Continue`, `Manage`, or `OK` when the outcome is known.

Why it fails:

- Hides consequence.
- Reduces member confidence.
- Makes QA and AI prompts ambiguous.

Preferred approach:

- Label actions by outcome, such as `Create customer`, `Schedule follow-up`, or `Retry import`.

## Destructive Action Without Confirmation

Anti-pattern:

- Completing destructive or material actions immediately without confirmation.

Why it fails:

- Creates business risk.
- Undermines Trustworthy Interaction.
- Makes recovery unclear.

Preferred approach:

- Confirm affected object, consequence, Workspace scope, and recovery availability.

## Stateless Async Interaction

Anti-pattern:

- Triggering async work without loading, success, error, or recovery feedback.

Why it fails:

- Members cannot tell whether work started, failed, or completed.
- Duplicate risky actions become more likely.

Preferred approach:

- Define loading, completed, and failed states for every async action.

## Feedback Far From Cause

Anti-pattern:

- Showing feedback away from the affected object or without enough context.

Why it fails:

- Members must search for meaning.
- Errors and recovery steps become easy to miss.

Preferred approach:

- Place feedback near the affected field, card, panel, section, or Workspace region.

## Navigation and Context Confusion

Anti-pattern:

- Treating Workspace switching, tabs, filters, and navigation as interchangeable controls.

Why it fails:

- Members lose orientation.
- Workspace-scoped actions may appear to affect the wrong context.

Preferred approach:

- Keep Workspace switching, navigation, filtering, and local disclosure distinct.

## AI Without Reason Or Control

Anti-pattern:

- Showing AI output without reason, confidence, uncertainty, or member control.

Why it fails:

- Reduces trust.
- Makes business decisions opaque.
- Prevents meaningful review.

Preferred approach:

- Pair AI output with reason, confidence or uncertainty, and accept/adjust/dismiss options.

## AI As Final Authority

Anti-pattern:

- Letting AI silently complete material business actions without member review.

Why it fails:

- Removes human control.
- Creates audit and trust risk.
- Conflicts with Human And AI Collaboration.

Preferred approach:

- Treat AI as recommendation, draft, summary, ranking, or assistant output unless a future governed automation slice explicitly defines otherwise.

## Workspace-Specific Interaction Forks

Anti-pattern:

- Creating separate interaction models for Retail, Recruitment, Admin, or future Workspaces.

Why it fails:

- Breaks platform scalability.
- Increases QA and design duplication.
- Conflicts with UK-004 shared layout guidance.

Preferred approach:

- Use shared interaction patterns with Workspace-specific metadata, labels, content, and business rules.

## Hover-Only Critical Controls

Anti-pattern:

- Revealing required controls only on hover.

Why it fails:

- Excludes keyboard, assistive technology, and touch users.
- Hides task-critical actions.

Preferred approach:

- Keep critical controls visible or reachable through accessible disclosure.

## Empty State With No Next Action

Anti-pattern:

- Explaining that no data exists without giving a useful next action or recovery option.

Why it fails:

- Leaves the member stranded.
- Makes onboarding and setup unclear.

Preferred approach:

- Pair empty states with creation, setup, import, clear-filter, or learn-more actions where applicable.

## Runtime Leakage

Anti-pattern:

- Defining API, data persistence, routing, RBAC, or model orchestration inside interaction documentation.

Why it fails:

- Blurs UI Kit scope.
- Duplicates runtime architecture.
- Makes documentation harder to verify.

Preferred approach:

- Document interaction intent and expected states only.

## Review Checklist

- Is the primary action visible and outcome-based?
- Is there exactly one primary action per unit?
- Are destructive actions confirmed?
- Do async actions show loading, success, error, and recovery?
- Is feedback near the affected object or region?
- Are Workspace switching and navigation distinct?
- Does AI output include reason, confidence or uncertainty, and human control?
- Are hover, focus, selected, disabled, and loading states accessible?
- Does the pattern avoid runtime and Design System implementation details?

## Status

Implemented.
