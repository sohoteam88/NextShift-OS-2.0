# ADR-010: Dashboard Mission Control

**Status:** Accepted (Architecture)
**Date:** 2026-06-15
**Supersedes:** ADR-007 (Dashboard Philosophy)
**Depends On:** ADR-006 (Journey Engine), ADR-008 (AI Coach System), ADR-009 (Journey V4 Product Architecture)

## Context

Historically, SaaS dashboards evolved into data-heavy control panels containing metrics, charts, analytics, activity feeds, notifications, and widgets. This approach works for operators and analysts. It fails for beginners.

In NextShift OS, the majority of users are first-time entrepreneurs, personal brand beginners, content beginners, and sales beginners. These users do not need more information. They need more direction.

## Decision

Dashboard is no longer a reporting center. Dashboard becomes **Mission Control**.

Its purpose is not to show everything. Its purpose is to tell users: **"What should I do next?"**

## Core Principle

> **Action First. Analytics Second.**

Users should see: Action → Progress → Guidance → Analytics. Never Analytics → Analytics → Analytics → Action.

## Dashboard Mission: Four Questions Only

| # | Question | Section |
|---|---|---|
| 1 | What should I do today? | Today's Mission |
| 2 | How far have I progressed? | Progress |
| 3 | Why does this matter? | AI Coach |
| 4 | How is my business doing? | Business Snapshot |

Anything outside these four questions does not belong on the dashboard.

## Dashboard Architecture

### Section 1: Today's Mission (Highest Priority)

```
Today's Mission: Brand Interview
⏱ Estimated Time: 10 Minutes
Reward:
  ✓ Brand Positioning
  ✓ Content Direction
  ✓ AI Coaching
[Continue →]
```

Button logic: `const nextAction = getNextJourneyAction(userProgress); router.push(nextAction.route)`

Dashboard never asks users where they want to go. Dashboard knows where they should go.

### Section 2: Progress

Purpose: Show momentum. Not statistics.

```
Growth Journey — Step 3 / 15
██████░░░░░░░░ — 20% Complete
Current Level: Explorer
```

### Section 3: AI Coach

AI Coach is not a chatbot. AI Coach is a guide. Must explain: Why (why this task matters), Outcome (what happens after), Mistake (common beginner mistakes).

### Section 4: Business Snapshot (Lowest Priority)

**Progressive Disclosure by Level:**

| Level | Shows |
|---|---|
| Explorer | Content Published, Leads Generated, Customers Acquired |
| Builder | + Lead Growth |
| Operator | + Revenue, Follow-Up Status |
| Leader | + Pipeline, Conversion, Team Activity, Funnel Health |

## Dashboard Layout

**Desktop:**
```
┌─────────────────────────────┐
│ Today's Mission             │
├────────────┬────────────────┤
│ Progress   │ AI Coach       │
├────────────┴────────────────┤
│ Business Snapshot           │
└─────────────────────────────┘
```

**Mobile:** Single-column only. No side scrolling. No dense widgets.

## Dashboard Rules

1. **One primary CTA.** Must be "Continue" or "Continue My Journey."
2. **Dashboard must never require decisions.** Bad: "Choose Funnel / Choose Module / Choose Path." Good: "Continue."
3. **Never more than four primary sections.**
4. **Users should understand what to do within 5 seconds.**

## Forbidden Dashboard Elements

Never place above Today's Mission: Analytics, Revenue, Charts, Activity Feed, Notifications, Pipeline, Traffic Metrics.

Never create: Widget Wall, Card Wall, Metric Wall.

The dashboard is not a BI tool.

## Success Metrics

A new user should:
- ✅ Understand their next action within 5 seconds
- ✅ Click Continue within 15 seconds
- ✅ Reach the correct task without navigation
- ✅ Never ask: "What should I do next?"
- ✅ Feel guided rather than overwhelmed

## Final Principle

Dashboard is not the brain, the database, or the reporting center.

Dashboard is: **The cockpit of the user's business journey.**

Every time a user logs in, they should immediately know: "What is the next best action to move my business forward today?"

## Related

- ADR-006 (Journey Engine)
- ADR-007 (Dashboard Philosophy) — superseded
- ADR-008 (AI Coach System)
- ADR-009 (Journey V4 Product Architecture)
