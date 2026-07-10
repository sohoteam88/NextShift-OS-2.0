# NextShift UI Kit v1.0

# UK-008 AI Design Anti-Patterns

**Execution Role:** Documentation Engineer  
**Assigned Agent:** Codex  
**Project:** NextShift UI Kit v1.0  
**Slice:** UK-008 Claude Design Brief  
**Lifecycle Phase:** Documentation Implementation  
**Inputs:** UK-008 Planning, UK-002 Anti-Patterns, UK-003 AI Component Prompts, UK-005 Interaction Anti-Patterns, UK-007 Brand Anti-Patterns  
**Outputs:** AI design generation approaches to avoid  
**Exit Criteria:** Anti-patterns prevent AI outputs from redefining UI Kit, Design System, runtime, or Workspace architecture

## Purpose

This document identifies AI design anti-patterns that Claude Design and future AI Design Agents should avoid.

## Missing Authority

Anti-pattern:

- Prompt omits Design System, UI Kit, or business authority.

Preferred approach:

- Always declare authority stack before generating a design artifact.

## Visual System Invention

Anti-pattern:

- AI creates new palettes, typography, spacing, shadows, tokens, gradients, components, or visual styles.

Preferred approach:

- Use released Design System authority and UI Kit usage guidance.

## Component Invention

Anti-pattern:

- AI invents a new component when an existing UK-003 or Design System component would work.

Preferred approach:

- Select existing components and document future component needs as proposals only.

## Workspace Forking

Anti-pattern:

- AI creates separate Retail, Recruitment, Admin, or future Workspace shells, layouts, themes, interactions, or component sets.

Preferred approach:

- Use shared Workspace structures with metadata, content, and labels.

## Happy Path Only

Anti-pattern:

- AI describes only the populated or successful state.

Preferred approach:

- Include loading, empty, error, success, disabled, selected, expanded, and recovery states where applicable.

## Data Before Decision

Anti-pattern:

- AI leads with raw tables, charts, or history before current status and next action.

Preferred approach:

- Use Decision-First UX and UK-004 hierarchy.

## AI Without Control

Anti-pattern:

- AI-generated UI lets AI output appear final or actioned without member control.

Preferred approach:

- Show recommendation, reason, confidence or uncertainty, and accept/adjust/dismiss actions.

## Accessibility Omission

Anti-pattern:

- AI omits keyboard, focus, screen reader, non-color state, or responsive accessibility expectations.

Preferred approach:

- Apply UK-006 constraints in every relevant prompt and output.

## Theme Overreach

Anti-pattern:

- AI defines tokens, palettes, CSS, mode switching, logo assets, or Workspace-specific themes.

Preferred approach:

- Apply UK-007 theme and branding guidance without redefining DS-001 or DS-008.

## Runtime Leakage

Anti-pattern:

- AI invents APIs, routes, persistence, RBAC, database state, frontend framework code, or telemetry.

Preferred approach:

- Keep output documentation-only unless a separate software task requests implementation.

## Vague Output Request

Anti-pattern:

- Prompt asks for "a good design" or "a modern screen" without output format, surface, state, or constraints.

Preferred approach:

- Name the output artifact and include full context, states, and constraints.

## Status

Implemented.
