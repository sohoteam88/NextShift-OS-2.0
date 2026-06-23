# COO-001A State Requirements Matrix

Status: Approved baseline
Owner: NextShift OS
Scope: AI COO state model

## Objective

Define the state requirements that the AI COO uses before selecting the next mission. This matrix is the documentation source for the state sequence currently implemented across `business-state`, `journey-engine`, and `mission-engine`.

## State Matrix

| State | Required evidence | Current gap when missing | Mission route |
| --- | --- | --- | --- |
| `BRAND_FOUNDATION` | AI interview completed | `NO_BRAND` | `/brand-builder/step/interview` |
| `BRAND_POSITIONING` | Brand DNA or positioning confirmed | `NO_POSITIONING` | `/brand-builder/step/profile` |
| `CONTENT_SYSTEM` | First content generated or content plan started | `NO_CONTENT` | `/content-engine` |
| `LEAD_MAGNET` | Lead magnet created | `NO_LEAD_MAGNET` | `/lead-magnet` |
| `FUNNEL` | Funnel published | `NO_FUNNEL` | `/funnel` |
| `LEAD_GENERATION` | Traffic source active and first lead generated | `NO_TRAFFIC` or `NO_LEADS` | `/traffic-engine` |
| `SALES` | Leads followed up and first customer acquired | `NO_APPOINTMENTS` or `NO_CUSTOMERS` | `/customers` or `/sales` |
| `TEAM_BUILDING` | Team duplication workflow is ready | `NO_TEAM` | `/team/growth` |

## Canonical Production Routes

Production routes are the source of truth for dashboard and mission actions.

| Mission type | Production route |
| --- | --- |
| Content | `/content-engine` |
| Funnel | `/funnel` |
| Traffic | `/traffic-engine` |
| Team growth | `/team/growth` |

Legacy documentation references such as `/content`, `/funnels`, `/traffic`, and plain `/team` are not valid AI COO route targets.

## Projection Requirements

Each dashboard projection must include:

- Current business state
- Completed states
- Missing requirements
- Current gap
- Mission
- Reasoning
- Expected outcome
- Route
- Completion status

## Acceptance Criteria

- Dashboard projection carries every field needed by dashboard components.
- UI does not infer state from labels, routes, or string matching.
- Route values match the canonical production routes above.
