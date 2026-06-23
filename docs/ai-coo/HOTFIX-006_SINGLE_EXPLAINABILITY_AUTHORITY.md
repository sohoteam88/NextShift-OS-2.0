# HOTFIX-006 Single Explainability Authority

Status: P0 Hotfix

Owner: AI COO System

Depends on:

- COO-004 Explainability Engine PRD
- HOTFIX-005 Explainability Localization
- COO-004 Explainability Engine Audit

## Problem

The AI COO stack had multiple explanation sources: Explainability Engine templates, Mission Authority copy, Bottleneck Engine copy, and Dashboard fallbacks. Multiple sources create drift, inconsistent recommendations, and higher maintenance cost.

## Objective

All user-facing explanation copy must originate from `ExplainabilityEngine` only.

## Authority Rules

`ExplainabilityEngine` owns:

- `whyThis`
- `whyNow`
- `whyNotOthers`
- `expectedOutcome`
- `expectedRisk`
- `nextMilestone`
- `locale`
- `source`

No other module may generate user-facing explanation copy.

## Fallback Rule

If a specific explanation template is unavailable, `ExplainabilityEngine` emits the centralized `EXPLAINABILITY_UNAVAILABLE` fallback. Dashboard and Mission Authority must not generate explanation fallback text.

## Bottleneck Rule

`BottleneckEngine` may emit evidence and internal diagnostics. It must not emit user-facing explanation copy.

## Dashboard Rule

Dashboard displays the resolved `ExplainabilityResult`. It must not translate, rewrite, simplify, infer, or generate explanation content.

## Audit Rule

Mission decision audit metadata stores:

- `explainabilitySource`
- `locale`
- all six explanation fields

The only valid `explainabilitySource` is `ExplainabilityEngine`.

## Acceptance Criteria

- `ExplainabilityAuthority.copyFor` removed.
- Bottleneck Engine user-facing explanations removed.
- Dashboard explanation fallbacks removed.
- Mission Authority generates no explanation copy.
- `ExplainabilityEngine` is the sole explanation source.
- Audit metadata records source.
- Type-check passes.
- Build passes.
