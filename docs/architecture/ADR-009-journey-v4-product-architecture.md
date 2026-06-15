# ADR-009: Journey V4 Product Architecture

**Status:** Accepted (Vision)
**Date:** 2026-06-15
**Supersedes:** ADR-006 (Journey Engine), ADR-007 (Dashboard Philosophy)

## Context

Journey V3 successfully introduced Beginner Mode and hid advanced funnel metrics. However, it still retains a dashboard-oriented mental model where users must navigate Dashboard → Journey → Choose Action.

The long-term vision for NextShift OS is not a marketing dashboard. It is a **guided business operating system** that helps complete beginners build a personal brand, attract customers, generate income, and eventually build a team.

Users should never wonder: "What is a funnel?", "What should I do next?", "Which page should I open?"

## Core Product Principle

> **Users do not buy software. Users buy progress.**

Therefore: **The system should guide progress, not expose complexity.**

## Strategic Direction

### From (Current)
```
Dashboard → Journey → Task
```

### To (V4 Target)
```
Dashboard → Next Action
```

Journey becomes a **Progress Map**, not a Control Center.

## Progressive Disclosure: Automatic Level System

Users should never manually choose between Beginner and Advanced mode. The system evolves with them.

| Level | Name | Visible | Unlocked At |
|---|---|---|---|
| **1** | Explorer | Current Mission, Progress, AI Coach | Default |
| **2** | Builder | + Content Metrics, Lead Metrics | First content published |
| **3** | Operator | + Customer Metrics, Revenue Metrics | First customer closed |
| **4** | Leader | + Pipeline, Conversion, Team Metrics, Funnel Health | First team member joined |

### What Explorer Should Never See

Conversion Rate, Pipeline, Traffic, Bottleneck, Funnel Health.

### What Explorer Should See

Current Task, Next Step, Estimated Time, Why This Matters.

## Dashboard = Mission Control

Dashboard should answer only one question: **"What should I do today?"**

```
┌──────────────────────────────────────────┐
│ Today's Mission: Brand Interview         │
│ ⏱ 10 Minutes                             │
│ ✓ Brand Positioning                      │
│ ✓ Content Direction                      │
│ ✓ AI Coaching                            │
│ [Continue My Growth Journey →]           │
└──────────────────────────────────────────┘
```

The Continue button calls `getNextJourneyAction()` and immediately redirects to the correct next step. No intermediate `/journey` page. No choice required.

## Growth Roadmap (15 Steps)

```
Step 1:  Brand Interview
Step 2:  Brand DNA
Step 3:  Social Setup
Step 4:  First Content
Step 5:  First Lead
Step 6:  First Customer
Step 7:  Follow-Up System
Step 8:  Content Engine
Step 9:  Lead Engine
Step 10: Sales Engine
Step 11: Automation Engine
Step 12: Team Building
Step 13: Leadership
Step 14: Scale
Step 15: Business Operator
```

## AI Coach Evolution

| Dimension | Current (V3) | Future (V4) |
|---|---|---|
| Recommendation | "Do this next" | Why this step matters |
| Context | None | What happens after completion |
| Education | None | Common mistakes |
| Timeline | None | Estimated completion time |
| Outcome | None | Expected outcome |

## Funnel Terminology Policy

**Avoid** in early-stage UI: Funnel, Conversion, Pipeline, Traffic, Bottleneck, Lead Velocity.

**Use**: Growth Stage, Current Mission, Customer Journey, Next Action, Progress.

## Success Criteria

A completely new user should:
1. Understand what to do within **5 seconds**
2. Complete first action within **1 minute**
3. Never need onboarding documentation
4. Never ask: "What should I do next?"
5. Feel guided throughout the entire journey

## Final Vision

NextShift OS is not a dashboard. It is:

> **"A GPS for building a personal brand and business."**

The user does not need to know the route. The system only needs to tell them: turn left, turn right, continue straight. You have arrived.

## Implementation Status

| Component | Status |
|---|---|
| `getNextJourneyAction()` utility | ✅ Built (V3) |
| `BeginnerJourneyView` component | ✅ Built (V3) |
| Beginner/Advanced mode toggle | ✅ Built (V3) |
| Dashboard → One-click next action | 🔜 V4 |
| Automatic level system (1–4) | 🔜 V4 |
| AI Coach evolution (why + outcomes) | 🔜 V4 |
| Growth Roadmap (15 steps) | 🔜 V4 |

## Related

- ADR-006 (Journey Engine — mandatory gates)
- ADR-007 (Dashboard Philosophy — action center)
- ADR-008 (AI Coach System — primary operating layer)
