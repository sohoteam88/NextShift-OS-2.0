# ADR-006: Journey Engine

**Status:** Accepted
**Date:** 2026-06-15

## Context

Most users joining NextShift OS are not marketers, funnel builders, or SaaS operators.

They are:
- Employees
- Side-hustle beginners
- Herbalife distributors
- Content beginners

Users do not know what step to take next. Historically the system exposed tools before guidance, creating confusion and low activation.

## Decision

NextShift OS adopts a **Journey-First Architecture**.

The system guides users through a fixed progression:

```
Workspace
   ↓
Brand Interview  ← mandatory gate
   ↓
Brand DNA        ← mandatory gate
   ↓
Content Foundation  ← mandatory gate
   ↓
First Funnel     ← mandatory gate
   ↓
First Lead       ← mandatory gate
   ↓
First Customer
```

Every dashboard, mission, AI recommendation, and onboarding experience must align to this journey.

## Rules

1. Every user has a current journey stage.
2. Dashboard CTA must always point to the next stage.
3. Users should never be presented with more than one primary next action.
4. Brand Interview is mandatory before Brand DNA.
5. Brand DNA is mandatory before Content generation.
6. Content foundation is mandatory before Funnel generation.
7. Funnel generation is mandatory before Lead acquisition workflows.

### Implementation (as of V6-6 + Phase 8A)

| Rule | Implementation |
|---|---|
| Brand Interview → Brand DNA gate | Server-side guard on `/brand-dna` page — checks `BrandInterview` record |
| Dynamic CTA | `MemberDashboard` checks `useMissionCurrent()` — shows "Start" vs "Continue" |
| Journey Progress visible | `JourneyProgress` component at top of dashboard |
| Single primary action | Dashboard reduced from 9 sections to 3 core actions |

## Success Metric

User can answer: **"What should I do next?"** within 3 seconds.

## Consequences

- ✅ Higher activation rate
- ✅ Less user confusion
- ✅ Predictable onboarding
- ⚠️ Less flexibility for advanced users

Advanced users may bypass journey via admin controls.

## Related

- Phase 8A (Dashboard V2)
- Journey Flow Fix (Phase 6-6)
- ADR-003 (Funnel Domain)
