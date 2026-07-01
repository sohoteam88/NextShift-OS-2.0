# NextShift UI Kit v1.0

# UK-003 Implementation Prompt

**Project:** NextShift UI Kit v1.0  
**Slice:** UK-003 Component Catalog  
**Lifecycle Phase:** Implementation

**Primary Tool:** Claude Design  
**Supporting Tool:** Codex (documentation/Storybook mapping only)

## Mission

Create the official Component Catalog for the NextShift UI Kit.

Transform the released NextShift Design System into a reusable, Workspace-aware component reference for designers, AI tools, frontend engineers, and QA.

Do not redesign the Design System.

## Objectives

Produce production-ready documentation that:

- Reuses DS v1.0 components
- Aligns with UK-001 Design Language
- Aligns with UK-002 Design Principles
- Documents usage rather than implementation
- Supports Workspace-centric UI composition
- Supports Claude Design, Figma, QA and frontend teams

## Required Deliverables

1. COMPONENT_CATALOG.md
2. COMPONENT_TAXONOMY.md
3. WORKSPACE_COMPONENTS.md
4. COMPONENT_USAGE_GUIDELINES.md
5. COMPONENT_STATES_AND_VARIANTS.md
6. COMPONENT_COMPOSITION_RULES.md
7. FIGMA_COMPONENT_NAMING.md
8. AI_COMPONENT_PROMPTS.md
9. QA_COMPONENT_CHECKLIST.md
10. IMPLEMENTATION_REPORT.md

## Documentation Requirements

For every documented component include:

- Purpose
- Usage
- When not to use
- Anatomy
- Variants
- States
- Responsive behaviour
- Accessibility notes
- Workspace behaviour
- Related components
- AI prompt wording
- Figma naming
- QA checklist
- Anti-patterns

## Workspace Requirements

Document Workspace-specific components including:

- Workspace Shell
- Workspace Header
- Workspace Navigation
- Workspace Context Bar
- Workspace Status
- Workspace Switcher
- Workspace Action Group
- Workspace Module Card

Describe composition and relationships only, not runtime behaviour.

## Explicit Non-Goals

Do NOT include:

- React or Vue code
- CSS
- Token definitions
- Component redesign
- Runtime logic
- RBAC
- Workspace persistence
- `businessMode` implementation

## Quality Expectations

The documentation should:

- Be enterprise-grade
- Be deterministic for AI generation
- Be reusable
- Avoid Design System duplication
- Scale across future Business OS workspaces

## Completion Checklist

Implementation is complete when all required deliverables exist, terminology is consistent with UK-001 and UK-002, Workspace-aware guidance is complete, and the slice is ready for Verification.
