# Admin Dashboard V3 PRD

Date: 2026-06-19
Status: Implemented
Priority: P1

## Objective

Transform the platform admin homepage from a data center into an operations center.

The homepage must help an admin identify these within 30 seconds:

- system problem
- user or tenant problem
- security or risk problem

## Scope

Route:

- `/platform-admin`

Secondary pages remain available for detailed review:

- `/platform-admin/health`
- `/platform-admin/tenant-health`
- `/platform-admin/growth`
- `/platform-admin/revenue`
- `/platform-admin/ai-profitability`
- `/platform-admin/audit-logs`

## Homepage Content Rules

The homepage contains only:

1. Platform Health
2. Action Queue
3. Launch Metrics
4. Security & Risk
5. Quick Actions

Everything else stays on secondary pages.

## V3 Layout

The homepage is a dense operational console:

- status header with platform state
- four primary cards
- one quick action strip
- one action queue

Primary cards:

| Card | Purpose | Source |
| --- | --- | --- |
| Platform Health | Shows operating state, active tenants, active users, and alert count | `platformOperatingService.getOperatingData()` |
| Launch Metrics | Shows 30-day launch score from activation, lead, and customer signals | growth window projection |
| Security & Risk | Shows at-risk and inactive tenant count | tenant health + summary |
| Revenue Control | Shows MRR, gross margin, and AI cost | revenue and AI summary |

Action Queue:

- Critical and high-priority alerts first.
- Tenant risk review when risky tenants exist.
- AI margin review when gross margin drops below threshold.
- Stable fallback when no action is required.

Quick Actions:

- Review tenant usage
- Check AI spend
- Open audit logs
- System health

## Constraints

| Requirement | Status |
| --- | --- |
| Fewer than 5 primary cards | PASS, 4 primary cards |
| Fewer than 2 charts | PASS, 1 progress bar visualization |
| One action queue | PASS |
| Load target under 2 seconds | Design target; depends on existing server-side data query |
| Avoid full system redesign | PASS |
| Avoid Journey redesign | PASS |
| Avoid Authority redesign | PASS |
| Avoid new large module | PASS |

## Usage Tracking

Admin usage tracking writes to the existing `analytics_events` table through:

- `POST /api/v1/platform-admin/usage`

Tracked events:

- dashboard view
- primary card click
- quick action click
- action queue click

Tracked fields:

- `eventType`
- `targetId`
- `targetKind`
- `section`
- `path`
- `dashboardVersion`

No new database table was introduced.

## Success Metric

Admin can identify:

- system problem from Platform Health and Action Queue
- user or tenant problem from Security & Risk and tenant risk queue items
- security problem from Security & Risk, audit logs, and action queue

Target time:

- under 30 seconds

## Final Decision

Admin Dashboard V3 homepage is implemented as a focused operations center.

Continue collecting usage data for 7 days before making the next layout decision.
