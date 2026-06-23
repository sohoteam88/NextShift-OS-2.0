# DASH-003 AI COO Route Contract

Status: Approved baseline
Owner: NextShift OS
Scope: Dashboard, Mission Engine, AI COO navigation

## Rule

Production routes are the source of truth. Do not change working routes to match outdated PRDs.

## Canonical Routes

| Mission type | Canonical route | Legacy route to avoid |
| --- | --- | --- |
| Content | `/content-engine` | `/content` |
| Funnel | `/funnel` | `/funnels` |
| Traffic | `/traffic-engine` | `/traffic` |
| Team growth | `/team/growth` | `/team` |

## Implementation Surfaces

These surfaces must emit canonical routes:

- Mission Engine authority snapshot
- Dashboard projection
- AI COO plan recommendations
- Dashboard CTAs
- Journey progress actions
- Sidebar and quick launch entries

## Acceptance Criteria

- Dashboard projection route fields match canonical routes.
- Dashboard components do not rewrite routes.
- New docs and tests refer to `/content-engine`, `/funnel`, `/traffic-engine`, and `/team/growth`.
