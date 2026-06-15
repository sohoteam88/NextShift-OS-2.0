# ADR-008: AI Coach System

**Status:** Accepted
**Date:** 2026-06-15

## Context

Most SaaS products provide tools. NextShift OS provides guidance.

The primary differentiator of NextShift OS is not CRM, Funnel Builder, or Content Generator. The differentiator is **AI Coach**.

## Decision

AI Coach becomes the **primary operating layer** of the platform.

Every recommendation originates from:

```
Journey Stage + User State + Brand DNA + Business Context
```

### Architecture

```
User State
    ↓
Mission Engine        ← determines current stage + progress
    ↓
Next Action Engine    ← computes single best next action
    ↓
AI Coach              ← presents recommendation with explanation
    ↓
User Action            ← user executes one action
```

### Implementation

| Component | Location | Role |
|---|---|---|
| Mission Engine | `mission-engine/` | Tracks 15-stage beginner journey, computes progress, XP |
| Next Action Engine | `funnel/services/funnel-health-service.ts` | `getNextBestAction()`, `getActivityNextAction()` |
| AI Coach UI | `dashboard/components/AiRecommendationPanel.tsx` | Renders recommendation above the fold |
| Journey Progress | `dashboard/components/JourneyProgress.tsx` | Shows current stage + progress bar |

## Responsibilities

**AI Coach:**
- Recommend next action
- Explain why
- Estimate effort
- Estimate outcome

**AI Coach does NOT:**
- Expose raw analytics
- Overwhelm users with options
- Present multiple competing actions

## Rules

1. **One primary recommendation.** Never more than one next action.
2. **Recommendation must align to journey stage.** No skipping ahead.
3. **Recommendation must be actionable.** User can execute immediately.
4. **Recommendation must include expected outcome.** "Complete X → unlock Y."
5. **Recommendation must reduce cognitive load.** User shouldn't need to think about what to do.

## Example

```
Current Stage: Brand Interview

Recommendation: Complete Brand Interview
Estimated Time: 5 minutes
Outcome:
  → Generate Brand DNA
  → Generate Content Strategy
  → Generate Video Topics
```

## Success Metric

Users follow AI Coach recommendations without requiring manual support.

## Consequences

- ✅ Higher activation — guided onboarding
- ✅ Better retention — users see progress
- ✅ Stronger differentiation — tools + guidance
- ⚠️ Requires accurate state tracking — Mission Engine must be reliable
- ⚠️ Requires reliable mission engine — if progress tracking fails, recommendations are wrong

## Related

- ADR-003 (Funnel Domain — contains health/next-action engines)
- ADR-006 (Journey Engine)
- ADR-007 (Dashboard Philosophy)
- Phase 2b+2c (Health + Next-Action Engine Consolidation)
