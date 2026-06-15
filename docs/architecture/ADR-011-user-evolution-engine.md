# ADR-011: User Evolution Engine

**Status:** Accepted (Architecture)
**Date:** 2026-06-15
**Depends On:** ADR-006 (Journey Engine), ADR-008 (AI Coach System), ADR-009 (Journey V4), ADR-010 (Dashboard Mission Control)

## Context

Most SaaS platforms treat all users the same. A beginner sees the same dashboard as an expert. This creates:
1. **Information Overload** — users see features they don't understand
2. **Feature Paralysis** — users don't know where to start
3. **Low Retention** — users feel overwhelmed and leave

NextShift OS is different. Users should evolve through the system. The platform should reveal complexity only when users are ready.

## Decision

NextShift OS will implement a **User Evolution Engine**. The platform automatically adapts interface, features, metrics, AI coaching, and recommendations based on user maturity. Users never manually choose a mode. The system decides.

## Core Principle

> **The user should only see what they need for their current stage. Everything else remains hidden.**

## Evolution Model: 4 Levels

```
Explorer → Builder → Operator → Leader
```

### Level 1: Explorer

**Objective:** Build clarity. **Focus:** Brand, Story, Audience, Positioning.

| Property | Value |
|---|---|
| Dashboard | Today's Mission, Progress, AI Coach |
| Hidden | Pipeline, Conversion, Revenue, CRM, Automation, Team |
| AI Coach Style | Teacher ("Let's first understand who you are...") |
| Required Milestones | Brand Interview, Brand DNA, Social Setup |
| Promotion | Explorer → Builder |

### Level 2: Builder

**Objective:** Build visibility. **Focus:** Content, Audience, Engagement, Leads.

| Property | Value |
|---|---|
| Dashboard | Content Published, Lead Count, Growth Progress |
| Unlocks | Content Engine, Lead Magnet Builder, Content Analytics |
| AI Coach Style | Content Strategist ("Consistency matters more than perfection...") |
| Required Milestones | 3 Published Contents, 1 Lead Generated |
| Promotion | Builder → Operator |

### Level 3: Operator

**Objective:** Build predictable income. **Focus:** Leads, Sales, Follow-Up, Customers.

| Property | Value |
|---|---|
| Dashboard | Lead Pipeline, Customer Count, Revenue, Follow-Up Status |
| Unlocks | CRM, Sales Engine, Follow-Up System, Revenue Dashboard |
| AI Coach Style | Sales Coach ("Focus on follow-up consistency...") |
| Required Milestones | 1 Customer, CRM Setup, Follow-Up Active |
| Promotion | Operator → Leader |

### Level 4: Leader

**Objective:** Build systems and teams. **Focus:** Leadership, Automation, Delegation, Scaling.

| Property | Value |
|---|---|
| Dashboard | Revenue, Pipeline, Conversion, Team Metrics, Funnel Health, Automation Status |
| Unlocks | Team Management, Automation Engine, Advanced Analytics, Funnel Intelligence |
| AI Coach Style | Business Mentor ("Build systems that work without you...") |
| Graduation | Open-ended — highest operating tier |

## Evolution Rules

1. **Progress is automatic.** Users cannot manually upgrade.
2. **Progress is milestone-based.** Never time-based. Bad: "30 days active." Good: "Brand DNA completed."
3. **Progress must feel earned.** Every level unlocks something meaningful.

## Level Detection Service

```typescript
type UserLevel = "explorer" | "builder" | "operator" | "leader";

function getUserLevel(user): UserLevel { ... }

interface UserEvolutionState {
  level: UserLevel;
  completedMilestones: string[];
  unlockedModules: string[];
  nextMilestone: string;
  progressPercentage: number;
}
```

## Dashboard Integration

Dashboard queries `getUserLevel()` then automatically renders the appropriate view (Explorer, Builder, Operator, or Leader dashboard). Journey roadmap adjusts visually — Explorer sees steps 1–3, Leader sees the full roadmap.

## Success Metrics

Users should:
- ✅ Understand current stage
- ✅ Understand next milestone
- ✅ Feel progress
- ✅ Never feel overwhelmed
- ✅ Unlock complexity gradually

## Final Principle

A beginner should never see a Leader dashboard. A Leader should never be limited by a beginner dashboard. The platform must evolve with the user.

NextShift OS does not just manage business growth. It **adapts** to business growth.

## Related

- ADR-006 (Journey Engine)
- ADR-008 (AI Coach System)
- ADR-009 (Journey V4 Product Architecture)
- ADR-010 (Dashboard Mission Control)
