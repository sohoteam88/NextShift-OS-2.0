# NextShift UI Kit v1.0

# UK-003 Figma Component Naming

**Project:** NextShift UI Kit v1.0  
**Slice:** UK-003 Component Catalog  
**Status:** Implemented

## Purpose

This document defines the Figma library naming convention for NextShift components so the Figma library, the [Component Catalog](COMPONENT_CATALOG.md), Storybook mapping, and AI generation share one deterministic vocabulary. It documents naming only; it does not define visual design, which is owned by the released Design System.

## Naming Structure

```text
Category/ComponentName
```

- `Category` is one of the seven taxonomy categories: `Foundation`, `Content`, `Navigation`, `Workspace`, `Business`, `AI`, `DataViz`.
- `ComponentName` is PascalCase and matches the catalog name (spaces removed).

Examples:

- `Foundation/Button`
- `Content/Table`
- `Navigation/TopbarItem`
- `Workspace/Switcher`
- `Business/KpiCard`
- `AI/RecommendationPanel`
- `DataViz/ChartContainer`

## Variant Properties

Figma component variants use the axis names defined in [Component States and Variants](COMPONENT_STATES_AND_VARIANTS.md):

| Property | Values |
| --- | --- |
| `type` | primary, secondary, ghost, destructive (emphasis) |
| `size` | sm, md, lg |
| `state` | default, hover, focus, active, disabled, loading, selected |
| `tone` | neutral, info, success, warning, danger |
| `density` | comfortable, compact |

A Button appears as `Foundation/Button` with properties `type`, `size`, `state` rather than as separate components per combination.

## Library Organization

```text
NextShift UI Kit
  Foundation/
  Content/
  Navigation/
  Workspace/
  Business/
  AI/
  DataViz/
```

Pages in the Figma library map one-to-one to taxonomy categories. Component sets live under their category page.

## Naming Rules

- Names are deterministic and match the catalog exactly; do not use synonyms.
- Do not encode variant values in the component name; use variant properties.
- Do not create workspace-specific components (`Workspace/RetailShell` is forbidden); workspace differences are metadata, not separate Figma components.
- New components must be added to the catalog and taxonomy before being published to the library.
- Deprecated components are marked `[deprecated]` in the description, not renamed.

## Storybook Mapping

Where a Storybook story exists, its title mirrors the Figma path:

```text
Figma:      Business/KpiCard
Storybook:  Business/KPI Card
```

This keeps design, implementation, and documentation navigable with one mental model. Storybook implementation itself is out of UK-003 scope.

## Alignment

- **UK-001 Design Language:** Figma component names reuse the catalog names, which follow UK-001 terminology; no synonyms are introduced.
- **UK-002 Design Principles:** Naming supports AI-First Experience and Consistency by giving design, implementation, and AI generation one deterministic vocabulary.
- **Design System:** DS-001 through DS-008 remain the visual and implementation authority; this document names components, it does not design them.

## Related Documents

- [Component Catalog](COMPONENT_CATALOG.md)
- [Component Taxonomy](COMPONENT_TAXONOMY.md)
- [Component States and Variants](COMPONENT_STATES_AND_VARIANTS.md)
- [AI Component Prompts](AI_COMPONENT_PROMPTS.md)
