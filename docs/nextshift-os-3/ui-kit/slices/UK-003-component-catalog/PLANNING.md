# NextShift UI Kit v1.0

# UK-003 Planning

**Project:** NextShift UI Kit v1.0  
**Slice:** UK-003 Component Catalog  
**Lifecycle Phase:** Planning  
**Status:** Planning  
**Planning Mode:** Workspace-Aware Component Catalog

## 1. Purpose

UK-003 defines the official Component Catalog for the NextShift UI Kit v1.0.

This slice transforms the released NextShift Design System component foundation into a reusable design asset catalog for Claude Design, Figma, frontend engineers, QA teams, and future Business Capabilities.

UK-003 does not redesign components. It documents how released Design System components should be selected, described, composed, and reused across Workspace-aware NextShift interfaces.

## 2. Strategic Context

NextShift OS 3.1 is evolving from an engine-centered product into a Workspace-centered operating system.

Therefore, the Component Catalog must support:

- Workspace Shell
- Workspace Header
- Workspace Navigation
- Workspace Context
- Workspace Actions
- Workspace Status
- Workspace Widgets
- Business Capability modules
- Admin and SuperAdmin surfaces
- Future Business OS extensions

The catalog must allow future workspaces to be added through configuration and composition rather than UI redesign.

## 3. Objectives

UK-003 shall produce a component usage catalog that:

- Reuses NextShift Design System v1.0
- Aligns with UK-001 Design Language
- Aligns with UK-002 Design Principles
- Supports Workspace-aware UI composition
- Provides deterministic component descriptions for AI generation
- Supports Figma library organization
- Supports frontend implementation planning
- Supports QA validation
- Avoids runtime, code, and token redesign

## 4. Scope

### Included

- Component categories
- Component purpose
- Usage guidance
- Component anatomy
- Variants
- States
- Composition rules
- Workspace-aware usage
- Do / Don't guidance
- AI prompt references
- Figma naming guidance
- QA inspection checklist
- Storybook mapping guidance where useful

### Excluded

- React implementation
- Vue implementation
- CSS implementation
- Token redesign
- Component redesign
- Runtime changes
- Data model changes
- RBAC implementation
- Workspace persistence implementation
- `businessMode` consolidation

## 5. Required Deliverables

UK-003 implementation must produce:

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

## 6. Component Categories

The catalog should classify components into the following categories:

### Foundation Components

Examples:

- Button
- Input
- Select
- Checkbox
- Radio
- Switch
- Badge
- Tag
- Tooltip
- Icon

### Content Components

Examples:

- Card
- Section
- List
- Table
- Empty State
- Loading State
- Error State
- Success State

### Navigation Components

Examples:

- Sidebar Item
- Topbar Item
- Breadcrumb
- Tab
- Menu
- Command Entry

### Workspace Components

Examples:

- Workspace Shell
- Workspace Header
- Workspace Switcher
- Workspace Context Bar
- Workspace Status Badge
- Workspace Action Group
- Workspace Module Card

### Business Components

Examples:

- KPI Card
- Revenue Driver Card
- Lead Summary Card
- Campaign Summary Card
- Decision Card
- Recommendation Card
- Risk Indicator
- Opportunity Indicator

### AI Components

Examples:

- AI Insight Card
- AI Recommendation Panel
- Confidence Indicator
- Reasoning Summary
- AI Activity Feed
- AI Action Prompt
- AI Status Indicator

### Data Visualization Components

Examples:

- Chart Container
- Metric Block
- Trend Indicator
- Comparison Panel
- Data Table
- Insight Annotation

## 7. Workspace-Aware Requirements

Every relevant component must define:

- Workspace applicability
- Workspace context dependency
- Workspace identity usage
- Workspace switching behavior where relevant
- Workspace status behavior where relevant
- Multi-workspace scalability
- Business OS compatibility

The catalog should make it possible to design a new Workspace UI without redefining the design system.

## 8. Documentation Standard

Each component entry should include:

- Name
- Category
- Purpose
- When to use
- When not to use
- Anatomy
- Variants
- States
- Responsive behavior
- Accessibility notes
- Workspace behavior
- AI prompt phrase
- Figma naming
- QA checklist
- Related components
- Anti-patterns

## 9. AI Design Compatibility

UK-003 must enable Claude Design and other AI design tools to generate consistent UI.

Component documentation must use:

- Deterministic names
- Stable component descriptions
- Explicit layout relationships
- Explicit state descriptions
- Clear composition rules
- No vague visual language
- No component invention unless marked as future proposal

## 10. Design System Compliance

UK-003 must not redefine DS-001 through DS-008.

It must reference the Design System as the implementation authority for:

- Tokens
- Base components
- Layout primitives
- Interaction foundations
- Accessibility foundations
- Theme foundations

## 11. Acceptance Criteria

UK-003 Planning is complete when:

- Scope is clearly defined.
- Workspace-aware catalog requirements are documented.
- Deliverables are listed.
- Component taxonomy is approved.
- Design System boundaries are protected.
- AI generation requirements are included.
- QA and Figma expectations are included.
- Slice is ready for Documentation Implementation.

## 12. Risks

### Risk: Component Catalog becomes implementation documentation

Mitigation:

Keep focus on usage, composition, and design guidance.

### Risk: Workspace components duplicate runtime architecture

Mitigation:

Document UI behavior and visual structure only. Do not define runtime logic.

### Risk: Component naming drift

Mitigation:

Reuse UK-001 terminology and UK-002 principles.

### Risk: Component scope expands into Admin UI

Mitigation:

Document reusable components only. Page-level Admin UI specifications belong to a future Admin UI project.

## 13. Verification Checklist

Before UK-003 can move to Audit, verify:

- All required deliverables exist.
- Component taxonomy is complete.
- Workspace-aware requirements are covered.
- AI prompt guidance exists.
- Figma naming guidance exists.
- QA checklist exists.
- No Design System duplication exists.
- No runtime implementation exists.
- UK-001 and UK-002 terminology remains consistent.

## 14. Next Phase

After Planning approval:

**UK-003 Documentation Implementation**

Expected output:

**UK-003_IMPLEMENTATION_PROMPT.md**
