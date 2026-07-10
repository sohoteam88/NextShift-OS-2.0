# NextShift UI Kit v1.0

# UK-003 QA Component Checklist

**Project:** NextShift UI Kit v1.0  
**Slice:** UK-003 Component Catalog  
**Status:** Implemented

## Purpose

This checklist lets QA reviewers validate that a component implementation matches the [Component Catalog](COMPONENT_CATALOG.md), the documented states, and the design principles. It is a design-conformance checklist, not a test suite. Accessibility and interaction implementation contracts are owned by DS-005 and DS-007.

## How To Use

For each component under review, complete the Universal checklist plus the relevant Category checklist. Record pass/fail and notes.

## Universal Checklist

- [ ] Component name matches the catalog exactly.
- [ ] Category matches the taxonomy.
- [ ] Purpose and usage match the catalog entry.
- [ ] All documented variants are present.
- [ ] All required states are present: default, hover, focus, active, disabled, loading, selected (as applicable).
- [ ] Remote-data components define empty, loading, and error states.
- [ ] State is communicated by text and shape, not color alone.
- [ ] One primary action per unit.
- [ ] Interactive elements have an accessible name describing the outcome.
- [ ] Focus is visible and follows visual order.
- [ ] Responsive behaviour preserves hierarchy and the primary action.
- [ ] No Design System token, primitive, or interaction contract is redefined.
- [ ] Terminology matches UK-001; usage aligns with UK-002 principles.

## Foundation

- [ ] Single responsibility; no embedded business meaning.
- [ ] Disabled state prevents interaction and is announced.
- [ ] Loading state (for actions) communicates busy status.
- [ ] Error state (for inputs) pairs a message with the field.

## Content

- [ ] Empty, loading, and error states are implemented for remote data.
- [ ] Primary action is visible, not buried in a menu.
- [ ] Tables preserve essential row context and the primary action on small screens.

## Navigation

- [ ] Active state derives from the current route.
- [ ] Navigation does not mutate data.
- [ ] Workspace navigation is populated from registry metadata, not hardcoded.

## Workspace

- [ ] One shared shell renders the workspace; no per-workspace fork.
- [ ] Workspace identity reflects the active workspace.
- [ ] Workspace Switcher changes business context, not the current view.
- [ ] Switcher is hidden when only one workspace exists.
- [ ] Surface supports N workspaces without redesign.
- [ ] Fallback renders correctly when no workspace context is present.

## Business

- [ ] Each metric is paired with operational relevance and a next action.
- [ ] Composed from Foundation/Content/Data Visualization components only.

## AI

- [ ] Recommendations are paired with reasoning and confidence.
- [ ] AI actions are reversible or confirmable.
- [ ] AI system state (idle, working, error) is shown honestly.
- [ ] Confidence is not communicated by color alone.

## Data Visualization

- [ ] Chart has title, legend, and empty/error states.
- [ ] A non-visual alternative to the chart is available.
- [ ] Series are distinguishable without relying on color alone.

## Sign-Off

| Field | Value |
| --- | --- |
| Component | |
| Reviewer | |
| Result | Pass / Fail |
| Notes | |

## Related Documents

- [Component Catalog](COMPONENT_CATALOG.md)
- [Component States and Variants](COMPONENT_STATES_AND_VARIANTS.md)
- [Component Usage Guidelines](COMPONENT_USAGE_GUIDELINES.md)
