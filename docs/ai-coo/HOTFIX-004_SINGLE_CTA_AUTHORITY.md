# HOTFIX-004 Single CTA Authority

## Problem

`DashboardProjectionAdapter` contained fallback CTA generation through `CanonicalMissionRegistry.ctaLabelFor`. That created a second CTA authority outside the AI COO authority layer.

CTA is a business decision. The Dashboard must display CTA from Mission Authority, not infer it from route, bottleneck, or mission type.

## Decision

Dashboard Projection may only pass through CTA from:

- `aiCommandCenter.ctaLabel`
- `priorityAction.ctaLabel`
- `priorityResult.ctaLabel`

If all authority CTA fields are missing, Dashboard Projection uses the static fallback:

- `Start Mission`

## Forbidden In Dashboard Projection

- `CanonicalMissionRegistry.ctaLabelFor`
- route-to-CTA logic
- bottleneck-to-CTA logic
- mission-type-to-CTA logic
- Priority Engine scoring helpers
- Bottleneck-to-CTA maps

## Allowed In Dashboard Projection

- Normalize payload shape
- Map backend field names to UI field names
- Provide static null-safe rendering defaults

## Acceptance Criteria

- No `CanonicalMissionRegistry.ctaLabelFor` call in `DashboardProjectionAdapter`.
- No CTA decision tree in dashboard module.
- CTA comes from Mission Authority output.
- Missing CTA falls back to static `Start Mission`.
- Route changes do not change CTA unless Mission Authority changes CTA.
- Tests cover authority CTA passthrough and missing CTA fallback.
