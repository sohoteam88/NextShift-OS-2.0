# NextShift UI Kit v1.0

# UK-003 Component Catalog

**Project:** NextShift UI Kit v1.0  
**Slice:** UK-003 Component Catalog  
**Status:** Implemented

## Purpose

This is the official Component Catalog for the NextShift UI Kit. It documents how released NextShift Design System v1.0 components should be selected, described, composed, and reused across Workspace-aware NextShift interfaces.

The catalog does not redesign or reimplement components. DS-001 through DS-008 remain the implementation authority. This catalog documents usage, composition, and design guidance for designers, Claude Design, frontend engineers, QA teams, and future Business Capabilities.

## How To Read This Catalog

Components are grouped by the seven categories defined in [Component Taxonomy](COMPONENT_TAXONOMY.md). Each category opens with a summary table, followed by full entries for the category's anchor components. Every entry follows the documentation standard below.

### Documentation Standard

Each component entry includes:

- **Purpose** — what the component is for.
- **Business value** — why it matters operationally.
- **When to use** / **When not to use**.
- **Anatomy** — the structural parts.
- **Variants** — approved variation axes.
- **States** — required interactive and content states.
- **Responsive behaviour** — how it adapts across viewports.
- **Accessibility** — intent and expectations (implementation owned by DS-007).
- **Workspace behaviour** — applicability, context dependency, multi-workspace scalability.
- **Related components**.
- **AI prompt phrase** — deterministic wording for Claude Design.
- **Figma naming** — library path.
- **QA checklist reference**.
- **Anti-patterns**.

State language, variant language, and composition language are defined once in [Component States and Variants](COMPONENT_STATES_AND_VARIANTS.md) and [Component Composition Rules](COMPONENT_COMPOSITION_RULES.md) and referenced here to avoid duplication.

---

## 1. Foundation Components

| Component | Purpose | Key variants | Key states | Figma name | AI prompt phrase |
| --- | --- | --- | --- | --- | --- |
| Button | Trigger an action | primary, secondary, ghost, destructive | default, hover, focus, active, disabled, loading | `Foundation/Button` | "primary button labelled by outcome" |
| Input | Capture short text | text, email, number, search | default, focus, filled, disabled, error | `Foundation/Input` | "labelled text input with error state" |
| Select | Choose one option | single, searchable | default, open, selected, disabled, error | `Foundation/Select` | "single-select dropdown" |
| Checkbox | Toggle a boolean in a set | single, group | default, checked, indeterminate, disabled | `Foundation/Checkbox` | "checkbox with label" |
| Radio | Choose one of a small set | group | default, selected, disabled | `Foundation/Radio` | "radio group" |
| Switch | Toggle an immediate setting | — | off, on, disabled | `Foundation/Switch` | "toggle switch for a setting" |
| Icon | Reinforce meaning | decorative, semantic | default | `Foundation/Icon` | "semantic icon paired with a label" |
| Badge | Show a count or short status | count, status | default | `Foundation/Badge` | "status badge with tone" |
| Tag | Label or categorize | default, removable | default, selected, disabled | `Foundation/Tag` | "removable tag" |
| Tooltip | Reveal supplementary text | — | hidden, visible | `Foundation/Tooltip` | "tooltip on hover or focus" |

### Button (anchor entry)

- **Purpose:** Trigger a single action.
- **Business value:** Actions are how members move work forward; clear buttons reduce hesitation and error.
- **When to use:** For a discrete, member-initiated action.
- **When not to use:** For navigation between surfaces (use a Navigation component or Link); for toggling an immediate setting (use Switch).
- **Anatomy:** Container, optional leading icon, label, optional loading indicator.
- **Variants:** `primary`, `secondary`, `ghost`, `destructive`; sizes `sm`, `md`, `lg`.
- **States:** default, hover, focus, active, disabled, loading. See [States and Variants](COMPONENT_STATES_AND_VARIANTS.md).
- **Responsive behaviour:** Label remains visible; primary actions are preserved across breakpoints (UK-002 Responsive-First Thinking).
- **Accessibility:** Every button has an accessible name describing the outcome; loading state communicates busy status; never rely on color alone. Implementation owned by DS-007.
- **Workspace behaviour:** Workspace-agnostic. May appear inside a Workspace Action Group where the available actions are resolved from workspace metadata.
- **Related components:** Workspace Action Group, AI Action Prompt, Menu.
- **AI prompt phrase:** `primary button labelled by outcome, e.g. "Schedule follow-up"`.
- **Figma naming:** `Foundation/Button` with variant properties `type`, `size`, `state`.
- **QA checklist:** See [QA Component Checklist](QA_COMPONENT_CHECKLIST.md#foundation).
- **Anti-patterns:** Generic labels (`Submit`, `Continue`, `Manage`); destructive action without confirmation (UK-002 Trustworthy Interaction); icon-only button without an accessible name.

### Input (anchor entry)

- **Purpose:** Capture a short, single-value text entry.
- **Business value:** Accurate capture reduces downstream data-quality work.
- **When to use:** For short freeform or constrained text.
- **When not to use:** For choosing from a known set (use Select); for long text (use a documented multiline pattern).
- **Anatomy:** Label, field, optional helper text, optional error message, optional affix (icon/unit).
- **Variants:** `text`, `email`, `number`, `search`.
- **States:** default, focus, filled, disabled, error. Error state pairs a message with the field.
- **Responsive behaviour:** Field width follows the containing layout; label and error remain attached.
- **Accessibility:** Programmatic label association; error announced, not color-only.
- **Workspace behaviour:** Workspace-agnostic.
- **Related components:** Select, Foundation Button, Error State.
- **AI prompt phrase:** `labelled text input with helper text and error state`.
- **Figma naming:** `Foundation/Input`.
- **Anti-patterns:** Placeholder used as the only label; silent validation failure.

---

## 2. Content Components

| Component | Purpose | Key variants | Key states | Figma name |
| --- | --- | --- | --- | --- |
| Card | Group related content into a unit | default, interactive | default, hover, selected, loading | `Content/Card` |
| Section | Title and group a region | default, collapsible | default, expanded, collapsed | `Content/Section` |
| List | Present ordered/unordered items | plain, interactive | default, empty, loading | `Content/List` |
| Table | Present rows and columns | default, sortable, selectable | default, empty, loading, error | `Content/Table` |
| Empty State | Communicate "no data yet" | first-run, filtered | default | `Content/EmptyState` |
| Loading State | Communicate work in progress | inline, skeleton | default | `Content/LoadingState` |
| Error State | Communicate failure + recovery | inline, block | default | `Content/ErrorState` |
| Success State | Confirm completion | inline, block | default | `Content/SuccessState` |

### Card (anchor entry)

- **Purpose:** Group related content and optional actions into a single unit.
- **Business value:** Cards create scannable units that support Decision-First UX (UK-002).
- **When to use:** To group a coherent set of information and its primary action.
- **When not to use:** As a decorative wrapper around a single control; to fake a layout grid (use DS-003 layout primitives).
- **Anatomy:** Container, optional header (title + meta), body, optional footer (actions).
- **Variants:** `default`, `interactive` (whole card is a target).
- **States:** default, hover (interactive only), selected, loading. Cards must define an empty and loading representation when they render remote data.
- **Responsive behaviour:** Cards reflow in a grid while preserving priority order.
- **Accessibility:** Interactive cards expose a single accessible action; nested interactive elements avoid ambiguous focus.
- **Workspace behaviour:** The Workspace Module Card, KPI Card, and AI Insight Card are business/workspace specializations of the Card pattern.
- **Related components:** Section, KPI Card, Workspace Module Card, AI Insight Card.
- **AI prompt phrase:** `content card with header, body, and a single primary action`.
- **Figma naming:** `Content/Card`.
- **Anti-patterns:** Multiple competing primary actions in one card; hiding required actions inside a card menu.

### Table (anchor entry)

- **Purpose:** Present structured rows and columns for comparison and action.
- **When to use:** For multi-attribute records that members compare or act on.
- **When not to use:** For a single record's detail (use Section/Card).
- **Anatomy:** Header row, body rows, optional selection column, optional row actions, pagination or virtualized scroll.
- **Variants:** `default`, `sortable`, `selectable`.
- **States:** default, empty, loading (skeleton rows), error. Always define the empty and error representations.
- **Responsive behaviour:** Preserve essential row context on small screens (UK-002 Responsive-First Thinking); avoid hiding the primary row action.
- **Accessibility:** Header association, sort state announced, keyboard row navigation.
- **Workspace behaviour:** Column sets may differ by workspace via metadata, but the Table itself is shared and unforked.
- **Related components:** Data Table (visualization variant), Empty State, Loading State, Error State.
- **AI prompt phrase:** `sortable table with empty and loading states`.
- **Figma naming:** `Content/Table`.
- **Anti-patterns:** Tables without an empty state; horizontal scrolling that hides the primary action.

---

## 3. Navigation Components

| Component | Purpose | Key states | Figma name |
| --- | --- | --- | --- |
| Sidebar Item | Destination in a vertical nav | default, hover, active, disabled | `Navigation/SidebarItem` |
| Topbar Item | Destination in a horizontal nav | default, hover, active | `Navigation/TopbarItem` |
| Breadcrumb | Show location in a hierarchy | default | `Navigation/Breadcrumb` |
| Tab | Switch between peer views | default, active, disabled | `Navigation/Tab` |
| Menu | Reveal grouped actions/links | closed, open, item-focus | `Navigation/Menu` |
| Command Entry | Palette entry for fast access | default, focus, selected | `Navigation/CommandEntry` |

### Topbar Item (anchor entry)

- **Purpose:** Represent a single destination in a horizontal navigation surface.
- **Business value:** Supports Workspace-aware navigation where destinations are resolved from workspace metadata.
- **When to use:** In the shared top navigation to reach a workspace destination.
- **When not to use:** To trigger an action (use Button); to change the active business context (use Workspace Switcher).
- **Anatomy:** Optional icon, label, active indicator.
- **States:** default, hover, active (matches current route). Active state is derived from the current path.
- **Responsive behaviour:** Overflow into a menu on smaller viewports; never drop the active destination.
- **Accessibility:** Current destination exposed to assistive technology; focus order follows visual order.
- **Workspace behaviour:** Populated from `WorkspaceRegistry.getNavigationItems()`. Retail and Recruitment differ by metadata only — a single shared renderer, never a per-workspace fork.
- **Related components:** Sidebar Item, Workspace Header, Workspace Switcher.
- **AI prompt phrase:** `top navigation item with active state, sourced from workspace navigation metadata`.
- **Figma naming:** `Navigation/TopbarItem`.
- **Anti-patterns:** Hardcoding workspace-specific navigation; creating `RetailNav` / `RecruitmentNav` variants.

---

## 4. Workspace Components

Summarized here; documented in full in [Workspace Components](WORKSPACE_COMPONENTS.md).

| Component | Purpose | Figma name |
| --- | --- | --- |
| Workspace Shell | Host the active Business OS in one shared shell | `Workspace/Shell` |
| Workspace Header | Identity, context, and switcher region | `Workspace/Header` |
| Workspace Switcher | Change the active workspace | `Workspace/Switcher` |
| Workspace Context Bar | Show active workspace context and scope | `Workspace/ContextBar` |
| Workspace Status Badge | Show workspace state (active, archived) | `Workspace/StatusBadge` |
| Workspace Action Group | Group workspace-scoped primary actions | `Workspace/ActionGroup` |
| Workspace Module Card | Entry point to a workspace capability | `Workspace/ModuleCard` |

---

## 5. Business Components

| Component | Purpose | Composed from | Figma name |
| --- | --- | --- | --- |
| KPI Card | Present a single decision metric | Card + Metric Block + Trend Indicator | `Business/KpiCard` |
| Revenue Driver Card | Summarize a revenue driver | Card + Metric Block | `Business/RevenueDriverCard` |
| Lead Summary Card | Summarize a lead/customer | Card + Badge + Button | `Business/LeadSummaryCard` |
| Campaign Summary Card | Summarize a campaign | Card + Metric Block | `Business/CampaignSummaryCard` |
| Decision Card | Present a decision + options | Card + Button group | `Business/DecisionCard` |
| Recommendation Card | Present a recommended action + reason | Card + AI reasoning | `Business/RecommendationCard` |
| Risk Indicator | Flag risk level | Badge + Icon | `Business/RiskIndicator` |
| Opportunity Indicator | Flag opportunity | Badge + Icon | `Business/OpportunityIndicator` |

### KPI Card (anchor entry)

- **Purpose:** Present a single metric that supports an operational decision.
- **Business value:** Directly serves Decision-First UX — a metric paired with its trend and next action.
- **When to use:** On dashboards to surface a decision-relevant signal.
- **When not to use:** To show a full chart (use Chart Container) or a raw table.
- **Anatomy:** Card container, metric label, Metric Block (value), Trend Indicator, optional link to detail.
- **Variants:** `default`, `with-trend`, `with-action`.
- **States:** default, loading (skeleton), empty (no data yet), error.
- **Responsive behaviour:** Stacks in a grid while preserving priority order.
- **Accessibility:** Value and trend communicated by text, not color alone.
- **Workspace behaviour:** Rendered from `WorkspaceRegistry.getDashboardWidgets()` metadata; the same shared KPI Card renders Retail and Recruitment metrics via configuration.
- **Related components:** Metric Block, Trend Indicator, Chart Container, Workspace Module Card.
- **AI prompt phrase:** `KPI card with metric value, trend indicator, and link to detail`.
- **Figma naming:** `Business/KpiCard`.
- **Anti-patterns:** Metrics without operational relevance (UK-002 Decision-First UX); color-only trend signalling.

---

## 6. AI Components

| Component | Purpose | Figma name |
| --- | --- | --- |
| AI Insight Card | Present a single AI-generated insight | `AI/InsightCard` |
| AI Recommendation Panel | Present a recommended action with reasoning | `AI/RecommendationPanel` |
| Confidence Indicator | Communicate model confidence | `AI/ConfidenceIndicator` |
| Reasoning Summary | Summarize why the AI recommended something | `AI/ReasoningSummary` |
| AI Activity Feed | Chronological AI activity | `AI/ActivityFeed` |
| AI Action Prompt | Offer an AI-suggested action | `AI/ActionPrompt` |
| AI Status Indicator | Show AI system state (idle, working, error) | `AI/StatusIndicator` |

### AI Recommendation Panel (anchor entry)

- **Purpose:** Present an AI-recommended action paired with its reason and confidence.
- **Business value:** Pairing a recommendation with reasoning and confidence supports Trustworthy Interaction and Human-and-AI Collaboration (UK-002).
- **When to use:** When surfacing an AI-suggested next action a member can accept or dismiss.
- **When not to use:** For deterministic system messages (use Content states).
- **Anatomy:** Panel container, recommendation statement, Reasoning Summary, Confidence Indicator, action group (accept / dismiss / adjust).
- **States:** default, loading, empty (no recommendation), error, accepted, dismissed.
- **Responsive behaviour:** Reasoning remains accessible on small screens (progressive disclosure).
- **Accessibility:** Confidence communicated by text and shape, not color alone; actions labelled by outcome.
- **Workspace behaviour:** AI profile mission/directives resolve from `WorkspaceRegistry.getAIProfile()` / `getAICOOProfile()`. The panel is shared; guidance text differs by workspace metadata, never by a forked AI panel.
- **Related components:** Confidence Indicator, Reasoning Summary, AI Action Prompt, Recommendation Card.
- **AI prompt phrase:** `AI recommendation panel with reasoning summary, confidence indicator, and accept/dismiss actions`.
- **Figma naming:** `AI/RecommendationPanel`.
- **Anti-patterns:** Recommendation without reason; confidence shown only as color; irreversible action without confirmation.

---

## 7. Data Visualization Components

| Component | Purpose | References | Figma name |
| --- | --- | --- | --- |
| Chart Container | Frame a chart with title, legend, states | DS-006 | `DataViz/ChartContainer` |
| Metric Block | Present a single value with label | DS-006 | `DataViz/MetricBlock` |
| Trend Indicator | Show direction and delta | DS-006 | `DataViz/TrendIndicator` |
| Comparison Panel | Compare two or more values | DS-006 | `DataViz/ComparisonPanel` |
| Data Table | Tabular quantitative data | DS-006 | `DataViz/DataTable` |
| Insight Annotation | Annotate a data point with meaning | DS-006 | `DataViz/InsightAnnotation` |

### Chart Container (anchor entry)

- **Purpose:** Provide a consistent frame around any chart, including its title, legend, and non-happy states.
- **When to use:** Whenever a chart is displayed on a NextShift surface.
- **When not to use:** For a single value (use Metric Block).
- **Anatomy:** Title, optional context/filter, chart region, legend, empty/loading/error states.
- **States:** default, loading, empty, error. A chart without an empty and error state is incomplete.
- **Responsive behaviour:** Preserve the metric's meaning when the chart resizes; legends reflow rather than truncate silently.
- **Accessibility:** Provide a text/table alternative for chart data (DS-007); never rely on color alone to distinguish series.
- **Workspace behaviour:** Chart configuration may vary by workspace analytics profile metadata; the container is shared.
- **Related components:** Metric Block, Trend Indicator, Comparison Panel, KPI Card.
- **AI prompt phrase:** `chart container with title, legend, and empty/loading/error states`.
- **Figma naming:** `DataViz/ChartContainer`.
- **Anti-patterns:** Charts without empty/error states; color-only series differentiation; decorative charts without a decision purpose.

---

## Component Index

Foundation: Button, Input, Select, Checkbox, Radio, Switch, Icon, Badge, Tag, Tooltip.  
Content: Card, Section, List, Table, Empty State, Loading State, Error State, Success State.  
Navigation: Sidebar Item, Topbar Item, Breadcrumb, Tab, Menu, Command Entry.  
Workspace: Workspace Shell, Header, Switcher, Context Bar, Status Badge, Action Group, Module Card.  
Business: KPI Card, Revenue Driver Card, Lead Summary Card, Campaign Summary Card, Decision Card, Recommendation Card, Risk Indicator, Opportunity Indicator.  
AI: AI Insight Card, AI Recommendation Panel, Confidence Indicator, Reasoning Summary, AI Activity Feed, AI Action Prompt, AI Status Indicator.  
Data Visualization: Chart Container, Metric Block, Trend Indicator, Comparison Panel, Data Table, Insight Annotation.

## Design System Compliance

Every entry references DS-001 through DS-008 as the implementation authority. Component and surface terminology follows the UK-001 Design Language; usage and selection follow the UK-002 Design Principles. This catalog introduces no tokens, no CSS, no React/Vue code, and no component redesign.

## Related Documents

- [Component Taxonomy](COMPONENT_TAXONOMY.md)
- [Workspace Components](WORKSPACE_COMPONENTS.md)
- [Component Usage Guidelines](COMPONENT_USAGE_GUIDELINES.md)
- [Component States and Variants](COMPONENT_STATES_AND_VARIANTS.md)
- [Component Composition Rules](COMPONENT_COMPOSITION_RULES.md)
- [Figma Component Naming](FIGMA_COMPONENT_NAMING.md)
- [AI Component Prompts](AI_COMPONENT_PROMPTS.md)
- [QA Component Checklist](QA_COMPONENT_CHECKLIST.md)
