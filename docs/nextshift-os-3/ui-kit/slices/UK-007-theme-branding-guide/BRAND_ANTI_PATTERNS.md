# NextShift UI Kit v1.0

# UK-007 Brand Anti-Patterns

**Execution Role:** Documentation Engineer  
**Assigned Agent:** Codex  
**Project:** NextShift UI Kit v1.0  
**Slice:** UK-007 Theme & Branding Guide  
**Lifecycle Phase:** Documentation Implementation  
**Inputs:** UK-007 Planning, UK-002 Anti-Patterns, UK-004 Layout Anti-Patterns, UK-005 Interaction Anti-Patterns, UK-006 Accessibility Anti-Patterns  
**Outputs:** Brand and theme approaches to avoid  
**Exit Criteria:** Anti-patterns protect Design System authority, Workspace consistency, accessibility, and operational clarity

## Purpose

This document identifies brand and theme approaches that should be avoided in NextShift product surfaces.

## Token Redefinition

Anti-pattern:

- Defining raw colors, palettes, typography, spacing, gradients, shadows, or CSS values in UI Kit branding guidance.

Preferred approach:

- Describe usage intent and reference the released Design System as implementation authority.

## Workspace Theme Fork

Anti-pattern:

- Creating Retail, Recruitment, Admin, or future Workspace-specific theme systems.

Preferred approach:

- Use the shared theme system with Workspace-specific metadata, labels, icons, and approved accents.

## Branding Over Task

Anti-pattern:

- Letting decorative brand elements outrank current state, primary decision, primary action, or recovery.

Preferred approach:

- Use brand expression to support context and trust while preserving operational hierarchy.

## Color-Only Meaning

Anti-pattern:

- Using brand or Workspace color as the only indicator of state, risk, validation, selection, or AI confidence.

Preferred approach:

- Pair color with text, icon, shape, structure, or explicit state language.

## Logo As Label

Anti-pattern:

- Replacing meaningful labels with logos or icons.

Preferred approach:

- Keep labels available and document accessible name expectations for icon-only controls.

## Decorative Empty State

Anti-pattern:

- Using branded empty-state visuals without explaining absence or next action.

Preferred approach:

- Pair brand assets with useful explanation and clear action where applicable.

## Mode-Specific Experience

Anti-pattern:

- Making light mode and dark mode behave like different products.

Preferred approach:

- Preserve the same hierarchy, components, state language, actions, and Workspace identity across modes.

## Brand Accent Overrides State

Anti-pattern:

- Letting brand accent override warning, danger, success, disabled, selected, or loading semantics.

Preferred approach:

- Semantic state tone always outranks decorative or identity accent.

## AI Visual Invention

Anti-pattern:

- Asking AI to create a new brand system, palette, logo set, theme, component style, or token set.

Preferred approach:

- Constrain AI to apply UK-007 guidance and the released Design System.

## Runtime Leakage

Anti-pattern:

- Defining theme persistence, account preference, CSS implementation, runtime switching, or asset loading behavior in UI Kit docs.

Preferred approach:

- Document design intent and usage rules only.

## Review Checklist

- Does the guidance avoid token values and CSS?
- Does Workspace branding avoid a theme fork?
- Does brand expression support, rather than compete with, task hierarchy?
- Is state communicated without relying on color alone?
- Are light and dark mode expectations equivalent?
- Are logos and icons paired with accessible identity expectations?
- Are AI prompts constrained from visual-system invention?

## Status

Implemented.
