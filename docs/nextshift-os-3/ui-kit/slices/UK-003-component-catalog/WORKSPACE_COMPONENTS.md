# NextShift UI Kit v1.0

# UK-003 Workspace Components

**Project:** NextShift UI Kit v1.0  
**Slice:** UK-003 Component Catalog  
**Status:** Implemented

## Purpose

This document specifies the Workspace-aware components that host every NextShift Business OS inside a single shared application shell. It exists because NextShift OS 3.1 evolved from an engine-centered product into a Workspace-centered operating system, where Retail and Recruitment (and future Business OSes) are rendered from Workspace Registry metadata rather than duplicated interfaces.

This is design and composition guidance only. Runtime resolution, persistence, and access control are owned by the platform architecture and the released Design System. The workspace runtime referenced here (Workspace Context, Workspace Registry, shared renderers) is described in the OS 3.1 architecture track (ARC-001 through ARC-006).

## Core Rule

One shared shell renders all workspaces. Retail and Recruitment differ through metadata only. No workspace may introduce a forked shell, forked navigation, forked dashboard, or cloned page.

```text
Workspace Manifest
    -> Workspace Registry
    -> Workspace Context
    -> Shared Workspace Components
    -> Business OS Experience
```

## Workspace Behaviour Contract

Every workspace-aware component must define:

- **Workspace applicability** — whether it renders in all workspaces or specific ones.
- **Workspace context dependency** — what workspace metadata it consumes.
- **Workspace identity usage** — how it reflects the active workspace name/type.
- **Workspace switching behaviour** — how it responds when the active workspace changes.
- **Workspace status behaviour** — how it reflects active vs archived state.
- **Multi-workspace scalability** — that it supports N workspaces without redesign.
- **Business OS compatibility** — that a new Business OS can be added by configuration.

## Components

### Workspace Shell

- **Purpose:** The shared application frame that hosts the header, navigation, and content region for the active workspace.
- **Workspace applicability:** All workspaces.
- **Context dependency:** Active workspace type; falls back to the legacy default workspace when no context is present.
- **Anatomy:** Header region, navigation region, content region, optional context bar.
- **States:** default, loading, and a fallback state when no workspace context is available (renders the legacy shell).
- **Multi-workspace scalability:** Adding a Business OS requires no shell change; the shell is metadata-driven.
- **Anti-patterns:** A `RetailShell` or `RecruitmentShell`; embedding business logic in the shell.

### Workspace Header

- **Purpose:** Present workspace identity, the Workspace Switcher, and top-level workspace navigation.
- **Context dependency:** Workspace name and navigation items from the registry.
- **Anatomy:** Product/tenant mark, Workspace Switcher, Workspace top navigation, member menu.
- **Switching behaviour:** Reflects the newly active workspace name and navigation immediately.
- **Anti-patterns:** Duplicating the header per workspace; hardcoding navigation labels.

### Workspace Switcher

- **Purpose:** Change the active workspace (the active Business OS), not the current view.
- **Workspace applicability:** Renders only when the member has more than one workspace.
- **Context dependency:** The member's available workspaces and the active workspace id.
- **States:** default, active option, hover, disabled; hidden when a single workspace exists.
- **Switching behaviour:** Selecting a workspace updates Workspace Context; dependent renderers re-resolve from metadata.
- **Multi-workspace scalability:** Presents N workspaces; does not assume exactly two.
- **Related components:** Workspace Header, Workspace Context Bar, Topbar Item.
- **AI prompt phrase:** `workspace switcher listing available workspaces with the active one indicated`.
- **Anti-patterns:** Treating the switcher as page navigation; persisting selection assumptions (persistence is future work).

### Workspace Context Bar

- **Purpose:** Communicate the active workspace context and scope of the current surface.
- **Context dependency:** Active workspace name, type, and optional status.
- **States:** default, workspace-archived (read-only emphasis).
- **Anti-patterns:** Repeating the full navigation; showing stale context after a switch.

### Workspace Status Badge

- **Purpose:** Communicate workspace state such as active or archived.
- **Variants:** `active`, `archived`.
- **Accessibility:** State communicated by text, not color alone.
- **Anti-patterns:** Using status color without a text label.

### Workspace Action Group

- **Purpose:** Group the primary actions available in the active workspace.
- **Context dependency:** Available actions derived from workspace capability metadata.
- **Composition:** Composed from Foundation Buttons; the group is shared, the action set is metadata-driven.
- **Anti-patterns:** Hardcoding a workspace-specific action set in the component.

### Workspace Module Card

- **Purpose:** Entry point to a workspace capability (for example CRM, Content, Funnel, Analytics, AI Coach, AI COO).
- **Context dependency:** Business capabilities and navigation routes from the registry.
- **Composition:** A Card specialization showing capability name, purpose, and a link to an existing shared route.
- **Multi-workspace scalability:** Capability set differs by workspace metadata; the card is shared.
- **Related components:** Card, KPI Card, Topbar Item.
- **AI prompt phrase:** `workspace module card linking to a capability route from workspace metadata`.
- **Anti-patterns:** Creating a capability page clone per workspace; embedding capability logic in the card.

## Workspace-Aware Usage Summary

| Component | Applicability | Consumes | Scales to N workspaces |
| --- | --- | --- | --- |
| Workspace Shell | All | active workspace type | Yes |
| Workspace Header | All | name + navigation | Yes |
| Workspace Switcher | Multi-workspace | workspace list + active id | Yes |
| Workspace Context Bar | All | name + status | Yes |
| Workspace Status Badge | Where status matters | status | Yes |
| Workspace Action Group | All | capability/action metadata | Yes |
| Workspace Module Card | All | capabilities + routes | Yes |

## Alignment

- **UK-001 Design Language:** Uses `Workspace`, `Dashboard`, `Panel`, `Card`, `Widget` terminology.
- **UK-002 Design Principles:** Enterprise Scalability (add workspaces without redesign), Consistency (one shared shell), Decision-First UX (module and KPI surfaces).
- **Design System:** DS-003 Layout System and DS-004 Dashboard Framework own the layout and dashboard implementation; DS-008 Theme & Branding owns per-workspace theming.

## Related Documents

- [Component Catalog](COMPONENT_CATALOG.md)
- [Component Composition Rules](COMPONENT_COMPOSITION_RULES.md)
- [Component Usage Guidelines](COMPONENT_USAGE_GUIDELINES.md)
