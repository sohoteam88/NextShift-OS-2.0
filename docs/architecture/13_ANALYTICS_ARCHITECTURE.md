# 13 — Analytics Architecture

## Purpose

Define event tracking, dashboards, and reporting for all user roles.

## Scope

Analytics module. Data sources come from all other modules.

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Event storage | Activity table (existing) + AnalyticsEvent table | Reuse activity log, add lightweight events |
| Dashboard | Server-computed aggregates, client-rendered charts | No separate analytics DB for MVP |
| Charts library | Recharts (React) | Lightweight, composable, already available |
| Real-time | Not for MVP; Supabase Realtime for future | Complexity not justified yet |

## Dashboard Views

### Member Dashboard
- My leads: total, by stage, conversion rate
- Daily action completion rate (this week)
- Content generated this month
- Funnel performance (views, conversions)

### Leader Dashboard
- Sub-team size and growth
- Team daily action completion rate
- Top performing members
- Team lead pipeline summary

### Operator Dashboard
- Total members (active, pending, inactive)
- Tenant-wide lead metrics (total, conversion rate, avg score)
- AI usage (calls this month, quota remaining)
- Funnel performance across all members
- Top performing members and leaders
- WhatsApp message stats (sent, delivered, replied)

### Platform Admin Dashboard
- Total tenants, active tenants
- Cross-tenant metrics (total users, total leads)
- AI cost tracking (total spend, per-tenant breakdown)
- System health (API errors, queue depth)

## Key Metrics

| Metric | Calculation | Used By |
|--------|-------------|---------|
| Lead Conversion Rate | Won leads / Total leads | All |
| Daily Action Rate | Completed actions / Assigned actions | Member, Leader |
| Funnel Conversion Rate | Form submissions / Page views | Member, Operator |
| Time-to-First-Contact | Avg hours from lead creation to first activity | Operator |
| Member Retention Rate | Active members / Total members (30-day) | Operator |
| AI Cost per Lead | Total AI spend / Total leads generated | Operator |
| Team Duplication Rate | New members recruited / Active members | Leader |

## Data Flow

```
[User Action] → [Service Layer] → [Log Activity/Event]
                                        │
                                        ▼
[Analytics API] ← [Aggregate queries on Activity + Lead + User tables]
                                        │
                                        ▼
                               [Dashboard Component]
                               [Recharts visualization]
```

## Main Components

```
src/modules/analytics/
├── services/
│   ├── member-metrics.service.ts    ← Member-level aggregates
│   ├── team-metrics.service.ts      ← Leader-level aggregates
│   ├── tenant-metrics.service.ts    ← Operator-level aggregates
│   └── platform-metrics.service.ts  ← Admin-level aggregates
├── components/
│   ├── MetricCard.tsx               ← Single metric display
│   ├── LeadPipelineChart.tsx        ← Funnel/bar chart
│   ├── ActivityTimeline.tsx         ← Timeline chart
│   ├── TeamPerformanceTable.tsx     ← Sortable table
│   └── DashboardLayout.tsx          ← Dashboard page layout
└── api/
    └── routes.ts
```

## Technical Considerations

- Aggregate queries should use database views or materialized views for performance
- Cache dashboard data for 5 minutes (invalidate on significant changes)
- Date range filter on all dashboards (7d, 30d, 90d, custom)
- Export to CSV for operator reporting
- All metrics respect tenant scoping and role-based visibility

## Future Expansion

- Real-time dashboard via Supabase Realtime subscriptions
- Predictive analytics (AI: which leads will convert this week?)
- Custom report builder
- Scheduled email reports to operators
- Cohort analysis (member retention by join month)

## Risks / Tradeoffs

| Risk | Mitigation |
|------|-----------|
| Slow aggregate queries | Indexed queries, materialized views, caching |
| Metric definitions drift | Document each metric formula in this doc |
| Dashboard overload | Role-based views showing only relevant metrics |
