# Admin Dashboard Usage Report

Date: 2026-06-19
Status: Tracking Enabled
Window: 7 days after deployment

## Objective

Track real platform-admin homepage usage before further dashboard redesign.

## Tracking Implementation

Usage tracking is implemented through:

- `POST /api/v1/platform-admin/usage`
- existing `analytics_events` table
- event name: `platform_admin_dashboard_interaction`

The endpoint requires:

- authenticated user
- `platform_admin` role

No anonymous admin tracking is accepted.

## Events Tracked

| Event | Trigger | Target Kind |
| --- | --- | --- |
| dashboard view | `/platform-admin` V3 mount | `dashboard` |
| primary card click | Platform Health, Launch Metrics, Security & Risk cards | `card` |
| quick action click | Tenant, AI spend, audit logs, health links | `action` |
| action queue click | Alert or risk item selected | `queue` |

## Report Queries

Most viewed widgets:

```sql
select
  properties->>'targetId' as target_id,
  count(*) as views
from analytics_events
where event_name = 'platform_admin_dashboard_interaction'
  and properties->>'eventType' = 'view'
  and properties->>'dashboardVersion' = 'v3'
  and created_at >= now() - interval '7 days'
group by 1
order by views desc;
```

Click frequency:

```sql
select
  properties->>'section' as section,
  properties->>'targetId' as target_id,
  properties->>'targetKind' as target_kind,
  count(*) as clicks
from analytics_events
where event_name = 'platform_admin_dashboard_interaction'
  and properties->>'eventType' = 'click'
  and properties->>'dashboardVersion' = 'v3'
  and created_at >= now() - interval '7 days'
group by 1, 2, 3
order by clicks desc;
```

Admin workflow paths:

```sql
select
  user_id,
  string_agg(properties->>'targetId', ' -> ' order by created_at) as path,
  count(*) as steps
from analytics_events
where event_name = 'platform_admin_dashboard_interaction'
  and properties->>'eventType' = 'click'
  and properties->>'dashboardVersion' = 'v3'
  and created_at >= now() - interval '7 days'
group by user_id
order by steps desc;
```

Least clicked widgets:

```sql
select
  properties->>'targetId' as target_id,
  count(*) as clicks
from analytics_events
where event_name = 'platform_admin_dashboard_interaction'
  and properties->>'eventType' = 'click'
  and properties->>'dashboardVersion' = 'v3'
  and created_at >= now() - interval '7 days'
group by 1
order by clicks asc;
```

## Current Finding

No 7-day production usage window has completed yet.

The next valid usage report should be generated after the deployed V3 homepage has been used by real platform admins for 7 days.

## Decision Rule After 7 Days

Keep a homepage widget if it is:

- clicked frequently, or
- the first click in a critical workflow path, or
- needed for system/security risk detection.

Move a homepage widget to a secondary page if it is:

- rarely clicked,
- never first in a workflow path,
- not tied to incident or launch decisions.
