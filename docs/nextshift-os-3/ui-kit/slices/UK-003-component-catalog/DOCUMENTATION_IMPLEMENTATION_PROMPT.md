# NextShift UI Kit v1.0

# UK-003 Documentation Implementation Prompt

**Project:** NextShift UI Kit v1.0

**Slice:** UK-003 Component Catalog

**Lifecycle Phase:** Documentation Implementation

**Primary Tool:** Claude Design

**Supporting Tools:** Codex (documentation website / Storybook mapping only)

## Mission

Produce the official **Component Catalog** for the NextShift UI Kit.

This slice transforms the released **NextShift Design System v1.0** into a complete, reusable, Workspace-aware design asset catalog.

The objective is to document how components should be selected, composed, and reused, not to redesign or reimplement them.

## Engineering Baseline

- NextShift Blueprint v1.0
- NextShift Core Runtime v1.0
- Engineering Playbook v1.2
- Continuous Engineering Mode (CEM v2)
- NextShift Design System v1.0 (Released)
- UK-001 Design Language (Released)
- UK-002 Design Principles (Released)

## Required Deliverables

Create the following production-ready documents:

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

## Component Categories

Document components within these categories:

### Foundation

Buttons, Inputs, Selects, Checkboxes, Radios, Switches, Icons, Badges, Tags, Tooltips.

### Content

Cards, Sections, Lists, Tables, Empty States, Loading States, Error States, Success States.

### Navigation

Sidebar, Top Navigation, Breadcrumbs, Tabs, Menus, Command Palette entries.

### Workspace

Workspace Shell, Header, Context Bar, Switcher, Status Badge, Action Group, Module Card.

### Business

KPI Cards, Revenue Cards, Lead Cards, Campaign Cards, Decision Cards, Recommendation Cards, Risk and Opportunity Indicators.

### AI

AI Insight Cards, Recommendation Panels, Confidence Indicators, Reasoning Summaries, Activity Feed, AI Status.

### Data Visualization

Chart Containers, Metric Blocks, Trend Indicators, Comparison Panels, Annotated Charts.

## Documentation Template

For every component include:

- Purpose
- Business value
- When to use
- When not to use
- Anatomy
- Variants
- States
- Responsive behaviour
- Accessibility considerations
- Workspace behaviour
- Related components
- AI prompt wording
- Figma naming convention
- QA checklist
- Anti-patterns

## Workspace-Aware Requirements

Describe how components behave within Workspace-based interfaces.

Include guidance for:

- Workspace identity
- Workspace context
- Workspace navigation
- Workspace actions
- Multi-workspace scalability
- Future Business OS compatibility

Document UI composition only.

Do not define runtime behaviour.

## AI Design Requirements

Documentation must be deterministic and reusable.

Every component description should enable Claude Design and future AI design agents to generate consistent UI without inventing new patterns.

## Explicit Non-Goals

Do NOT include:

- React code
- Vue code
- CSS
- Token definitions
- Component redesign
- Runtime implementation
- Persistence logic
- RBAC
- `businessMode` implementation

## Quality Expectations

The completed documentation must:

- Reuse the released Design System
- Align with UK-001 terminology
- Align with UK-002 principles
- Support Figma libraries
- Support Storybook mapping
- Support QA validation
- Be suitable for enterprise-scale Workspace-based products

## Completion Checklist

Implementation is complete only when:

- All required documents exist.
- Component taxonomy is complete.
- Workspace-aware guidance is documented.
- AI prompt guidance is complete.
- Figma naming guidance is complete.
- QA checklist is complete.
- No Design System content is duplicated.
- The slice is ready for Verification.
