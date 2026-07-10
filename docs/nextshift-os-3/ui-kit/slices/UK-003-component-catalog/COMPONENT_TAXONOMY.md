# NextShift UI Kit v1.0

# UK-003 Component Taxonomy

**Project:** NextShift UI Kit v1.0  
**Slice:** UK-003 Component Catalog  
**Status:** Implemented

## Purpose

This document defines the official classification system for the NextShift Component Catalog. It establishes the categories a component can belong to, the rules for placing a component in a category, and the boundaries between categories.

The taxonomy is the authority for *how components are organized*. The [Component Catalog](COMPONENT_CATALOG.md) is the authority for *what each component is*. The released NextShift Design System v1.0 (DS-001 through DS-008) remains the authority for how components are implemented.

## Classification Principles

- A component belongs to exactly one primary category.
- Categories are defined by role in the interface, not by visual appearance.
- Business and AI categories describe composition of Foundation and Content components; they do not introduce new primitives.
- Workspace components describe the shell that hosts all other categories.
- No category may redefine a Design System token, primitive, or interaction contract.

## Category Model

```text
Workspace Components        (the shell that hosts everything)
        |
        v
Navigation Components       (movement between surfaces)
        |
        v
Content Components          (structure for information)
        |
        v
Foundation Components       (atomic controls and indicators)

Business Components  +  AI Components  +  Data Visualization Components
        (compositions rendered inside Content and Workspace surfaces)
```

## Categories

### 1. Foundation Components

Atomic, single-responsibility controls and indicators. They are the smallest reusable units and map most directly to DS-002 Component Library primitives.

- Membership rule: renders a single control or a single indicator with no internal business meaning.
- Examples: Button, Input, Select, Checkbox, Radio, Switch, Icon, Badge, Tag, Tooltip.
- Not this category: anything that arranges multiple foundation components into a labelled unit (that is Content).

### 2. Content Components

Structural containers that arrange information and foundation components into readable units.

- Membership rule: provides layout and grouping for content, with no business-specific semantics.
- Examples: Card, Section, List, Table, Empty State, Loading State, Error State, Success State.
- Not this category: a card whose meaning is business-specific such as a KPI Card (that is Business).

### 3. Navigation Components

Components that move a member between surfaces or reveal available destinations.

- Membership rule: primary role is wayfinding or destination selection.
- Examples: Sidebar Item, Topbar Item, Breadcrumb, Tab, Menu, Command Entry.
- Not this category: the Workspace Switcher, which changes the active business context rather than the current view (that is Workspace).

### 4. Workspace Components

The shared application shell and workspace-aware surfaces that host every Business OS. These components consume Workspace Context and Workspace Registry metadata.

- Membership rule: renders or scopes the active workspace shell, identity, context, or module surface.
- Examples: Workspace Shell, Workspace Header, Workspace Switcher, Workspace Context Bar, Workspace Status Badge, Workspace Action Group, Workspace Module Card.
- Detailed guidance: [Workspace Components](WORKSPACE_COMPONENTS.md).

### 5. Business Components

Content compositions that carry business meaning for operational decisions. They reuse Foundation and Content components; they do not add new primitives.

- Membership rule: represents a business object, metric, or decision.
- Examples: KPI Card, Revenue Driver Card, Lead Summary Card, Campaign Summary Card, Decision Card, Recommendation Card, Risk Indicator, Opportunity Indicator.

### 6. AI Components

Content compositions that present AI output, confidence, and reasoning. They make AI-assisted work legible and trustworthy.

- Membership rule: presents AI-generated insight, recommendation, confidence, reasoning, or activity.
- Examples: AI Insight Card, AI Recommendation Panel, Confidence Indicator, Reasoning Summary, AI Activity Feed, AI Action Prompt, AI Status Indicator.

### 7. Data Visualization Components

Components that present quantitative information. They reference DS-006 Data Visualization for implementation.

- Membership rule: primary role is to visualize a metric, trend, or comparison.
- Examples: Chart Container, Metric Block, Trend Indicator, Comparison Panel, Data Table, Insight Annotation.

## Category Boundary Rules

| If a component… | Category |
| --- | --- |
| renders one control or indicator | Foundation |
| groups content without business meaning | Content |
| moves the member between surfaces | Navigation |
| hosts or scopes the active workspace | Workspace |
| represents a business object or decision | Business |
| presents AI output or confidence | AI |
| visualizes a metric, trend, or comparison | Data Visualization |

## Naming Alignment

- Category and component names reuse UK-001 Terminology Glossary and Information Language.
- Names are deterministic and stable for AI generation (see [AI Component Prompts](AI_COMPONENT_PROMPTS.md)).
- Figma library grouping follows this taxonomy (see [Figma Component Naming](FIGMA_COMPONENT_NAMING.md)).

## Design System Compliance

This taxonomy classifies usage. It does not redefine DS-001 Design Tokens, DS-002 Component Library, DS-003 Layout System, DS-004 Dashboard Framework, DS-005 Interaction System, DS-006 Data Visualization, DS-007 Accessibility, or DS-008 Theme & Branding.

## Related Documents

- [Component Catalog](COMPONENT_CATALOG.md)
- [Workspace Components](WORKSPACE_COMPONENTS.md)
- [Component Composition Rules](COMPONENT_COMPOSITION_RULES.md)
