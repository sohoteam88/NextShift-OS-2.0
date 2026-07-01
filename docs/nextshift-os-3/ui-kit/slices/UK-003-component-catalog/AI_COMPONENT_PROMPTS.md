# NextShift UI Kit v1.0

# UK-003 AI Component Prompts

**Project:** NextShift UI Kit v1.0  
**Slice:** UK-003 Component Catalog  
**Status:** Implemented

## Purpose

This document provides deterministic prompt wording for Claude Design and future AI design agents to generate NextShift components consistently, without inventing new patterns. It operationalizes UK-002 AI-First Experience and Human-and-AI Collaboration for the component layer.

## Prompt Structure

Every component prompt states four things:

```text
Design authority:   NextShift Design System v1.0 (DS-001..DS-008)
Language authority:  NextShift UI Kit v1.0 (UK-001, UK-002, UK-003)
Component:           <Category/ComponentName>
Requirement:         <purpose, variants, states, workspace behaviour>
```

Stating authorities prevents the model from redefining Design System primitives or inventing components.

## Global Constraints (include in every prompt)

- Reuse released Design System components; do not invent new primitives.
- Use catalog names exactly; do not use synonyms.
- Include the required states: default, hover, focus, disabled, loading, empty, error, success where applicable.
- Communicate state with text and shape, not color alone.
- For workspace surfaces, resolve content from workspace metadata; do not hardcode Retail/Recruitment differences.
- One primary action per unit.
- Output is a design description or spec, not React, Vue, CSS, or tokens.

## Component Prompt Phrases

| Component | Prompt phrase |
| --- | --- |
| Button | `Foundation/Button, primary, labelled by outcome, with hover/focus/disabled/loading states` |
| Input | `Foundation/Input, labelled, with helper text and an error state` |
| Select | `Foundation/Select, single-select, with default/open/selected/disabled/error states` |
| Card | `Content/Card with header, body, and one primary action; include loading and empty states` |
| Table | `Content/Table, sortable, with empty, loading, and error states; preserve the primary row action on small screens` |
| Topbar Item | `Navigation/TopbarItem sourced from workspace navigation metadata, with an active state` |
| Workspace Switcher | `Workspace/Switcher listing available workspaces with the active one indicated; hidden when only one workspace exists` |
| Workspace Module Card | `Workspace/ModuleCard linking to a capability route from workspace metadata` |
| KPI Card | `Business/KpiCard with metric value, trend indicator, and link to detail; include empty/loading/error states` |
| Decision Card | `Business/DecisionCard presenting a decision with two or three labelled options` |
| AI Recommendation Panel | `AI/RecommendationPanel with reasoning summary, confidence indicator, and accept/dismiss actions` |
| Confidence Indicator | `AI/ConfidenceIndicator communicating model confidence by text and shape, not color alone` |
| Chart Container | `DataViz/ChartContainer with title, legend, and empty/loading/error states; provide a text alternative` |

## Full Prompt Example

```text
Design authority: NextShift Design System v1.0 (DS-001..DS-008)
Language authority: NextShift UI Kit v1.0 (UK-001, UK-002, UK-003)
Component: Business/KpiCard
Requirement: Design a KPI card for a workspace dashboard. Show a metric label,
value (Metric Block), a Trend Indicator, and a link to detail. Include default,
loading, empty, and error states. Resolve the metric from workspace dashboard
metadata so Retail and Recruitment render from the same card. Communicate trend
by text and shape, not color alone. Output a design spec, not code.
```

## Anti-Patterns For AI Generation

- Asking the model to "create a new component" without marking it a future proposal.
- Prompts that omit the required states.
- Prompts that request workspace-specific forks.
- Vague visual language ("make it modern") instead of purpose, variants, and states.
- Requesting code or tokens from a catalog-level prompt.

## Related Documents

- [Component Catalog](COMPONENT_CATALOG.md)
- [Component States and Variants](COMPONENT_STATES_AND_VARIANTS.md)
- [Figma Component Naming](FIGMA_COMPONENT_NAMING.md)
