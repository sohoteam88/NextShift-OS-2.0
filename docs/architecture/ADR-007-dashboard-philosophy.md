# ADR-007: Dashboard Philosophy

**Status:** Accepted
**Date:** 2026-06-15

## Context

Previous dashboard versions displayed funnel health, pipeline metrics, conversion metrics, activity feeds, and AI CEO summaries. Users saw information but took little action.

## Decision

**Dashboard is an Action Center.**

Dashboard is NOT:
- CRM
- Analytics platform
- Admin console
- Reporting tool

Dashboard exists to drive the next action.

## Principles

1. **One screen.** Target height < 800px desktop — no scrolling required.
2. **One primary CTA.** Dynamic based on journey progress (Start/Continue Journey).
3. **One primary mission.** Today's action card — the single most important task.
4. **AI Coach visible above fold.** Personalized recommendation without scrolling.
5. **Journey progress visible above fold.** User always knows where they are.
6. **Analytics belong in Business pages.** Moved Funnel OS, DNA Health, Pipeline to dedicated pages.
7. **Operational controls belong in Admin pages.** Settings, user management, billing live in `/admin`.

## Layout

```
┌──────────────────────────────────────────┐
│ "What should I do today?"   [Continue →] │  ← Hero + Dynamic CTA
├──────────────────────────────────────────┤
│ 📄 12    👥 5    🎯 2    💰 RM149       │  ← Quick Stats (4 only)
├──────────────────────────────────────────┤
│ ⚡ Journey Progress: ▓▓▓▓▓▓░░░░ 60%     │  ← Progress bar + timeline
│    [✓] Brand [✓] Content [○] Funnel ...  │
├──────────────────┬───────────────────────┤
│ 🤖 AI Coach      │ 🎯 Today's Mission   │  ← Action cards
└──────────────────┴───────────────────────┘
```

### What was removed

| Removed | Rationale |
|---|---|
| FunnelOperatingCenter | Moved to `/funnel-os` |
| DNA Health Card | Moved to Brand DNA page |
| Pipeline / Conversion metrics | Moved to Business page |
| AI CEO Summary | Redundant with AI Coach |
| Activity Feed | Moved to Admin/Operations |
| Milestones | Embedded in Journey Progress |

## Success Metric

A first-time user can identify: current stage, next action, and expected outcome — within **3 seconds**.

## Consequences

- ✅ Cleaner UI — from 9 sections to 3 core actions
- ✅ Better activation — no information overload
- ✅ Faster onboarding — predictable path
- ⚠️ Less data density — power users use Business Dashboard instead

## Related

- Phase 8A (Dashboard V2 Implementation)
- ADR-006 (Journey Engine)
