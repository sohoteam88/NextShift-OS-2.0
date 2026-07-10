# Business Platform Integration

Version: 1.0

Status: Implemented

Last Updated: 2026-07-08

---

## Purpose

Define how Business Architecture v1.0 integrates with released platform foundations.

---

## Integration Surfaces

| Platform | Integration Responsibility |
| --- | --- |
| Business OS | Provides business operating foundation and released BOS capability baseline |
| Runtime Platform | Provides kernel, context, session, workspace, capability, event, permission, and diagnostics foundation |
| Workspace Runtime | Carries workspace identity, state, context, and personalization |
| Event Runtime | Carries business facts and workflow lifecycle events |
| Workflow Catalog | Provides released workflow patterns for repository health, CRM, content planning, opportunities, campaigns, forecasts, and analytics |
| Capability Boundaries | Preserve vertical slice boundaries and avoid cross-layer ownership leaks |

---

## Integration Flow

```text
Business Foundation
  -> Business Brain
  -> Decision Engine
  -> Conversation Engine
  -> Creative Studio / Growth & Revenue
  -> Workflow execution
  -> Event Runtime
  -> Learning and Reflection
  -> Business Foundation
```

---

## Event Principles

Business Architecture events should describe completed business facts.

Events must not be used as commands.

Example event responsibilities:

- business profile completed
- recommendation proposed
- decision approved
- creative package approved
- lead qualified
- opportunity evaluated
- campaign executed
- forecast reviewed
- analytics insight reviewed

---

## Boundary

Business Platform Integration defines connections between product layers and platform foundations.

It does not implement runtime behavior, persistence, queues, external integrations, APIs, or UI.
