# Interview Authority Precedence Report

Scope: discovery only. This report records the actual runtime precedence rules currently implemented in the repo.

## Global Finding

There is no single global precedence rule for all interview-derived truth. Current precedence is projection-specific and, in some cases, phase-specific.

The runtime currently splits into these precedence families:

1. live interview capture precedence
2. confirmed profile read precedence
3. legacy builder-page precedence
4. unresolved business-mode precedence

## 1. InterviewProfileSnapshot

### Primary

Current runtime has two active primary sources depending on phase:

1. live interview phase:
   - `BrandInterview.answers`
2. confirmed downstream profile phase:
   - `BrandProfile`

### Secondary

1. live extraction phase:
   - `BrandInterview.extractedProfile`
2. downstream compatibility phase:
   - `User.metadata.brand_profile`

### Fallback

Last-resort fallback for downstream profile consumers:

- `User.metadata.brand_profile`

### Conflict Rule

There is no single global conflict rule. Current rules observed in code are:

1. extraction input conflict rule in `brand-interview-service.extractBrandProfile()`:
   - `answers.__dialogue.messages` wins
   - else `voiceProfile.transcript`
   - else raw `answers`
2. confirmed downstream read conflict rule in `brandDnaService.getBrandDNA()`:
   - `BrandProfile` wins
   - fallback to `metadata.brand_profile`
3. legacy builder page conflict rule:
   - page reads `metadata.brand_profile` only
   - `BrandProfile` is ignored by those pages

## 2. AudienceSnapshot

### Primary

Current primary read authority for downstream runtime:

- `BrandProfile.targetAudience`
- `BrandProfile.audiencePainPoints`

### Secondary

Current secondary sources:

- `BrandInterview.extractedProfile.target_audience`
- `BrandInterview.extractedProfile.audience_pain_points`

### Fallback

Current compatibility and side-channel fallbacks:

1. `User.metadata.brand_profile.target_audience`
2. `User.metadata.brand_profile.audience_pain_points`
3. onboarding metadata:
   - `metadata.goals.target_audience`
   - top-level `metadata.target_audience`

### Conflict Rule

Current read conflict rule depends on consumer:

1. `BrandContextProvider`, `brandDnaService`, and `brand-health-projection`:
   - `BrandProfile` wins
   - fallback to `metadata.brand_profile`
2. interview extraction path:
   - extracted audience fields win over raw slot values because consumers read `extractedProfile` output after extraction
3. onboarding path:
   - no automatic reconciliation with `BrandProfile`
   - onboarding metadata can coexist with conflicting audience truth

So the current runtime winner for most downstream consumers is `BrandProfile`, but no system-wide reconciliation exists against onboarding metadata.

## 3. BusinessContextSnapshot

### Primary

Current primary downstream structured context source:

- `BrandProfile`

### Secondary

Current secondary source:

- `BrandInterview.extractedProfile`

This is used directly by:

- confirm flow
- regeneration flow

### Fallback

Current fallback sources:

1. `User.metadata.brand_profile`
2. `metadata.brand_positioning`

### Conflict Rule

Current conflict resolution is not uniform.

Observed rules:

1. `brandDnaService.getBrandDNA()`:
   - `BrandProfile` wins
   - `metadata.brand_profile` is fallback
2. `BrandContextProvider.getBrandContext()`:
   - `BrandProfile` wins
   - `metadata.brand_profile` is fallback
3. `brand-builder/calendar/page.tsx`:
   - page merges both
   - `legacyBrandProfile.contentPillars` wins if present
   - else `brandDNA.content.contentPillars`
   - `legacyBrandProfile.contentStrategy` wins if present
   - else generated strategy from canonical DNA
4. `onboarding-service`:
   - `metadata.brand_positioning` exists independently
   - no automatic merge-back into `BrandProfile`

So the general downstream winner is `BrandProfile`, but some active pages still override it with specific legacy fields.

## 4. BusinessModeSnapshot

### Primary

No canonical primary source exists.

Current active winners are consumer-local:

1. client funnel OS UI:
   - `localStorage['nextshift.currentFunnel']`
2. funnel OS API:
   - query param `type`
3. funnel context generation:
   - passed `funnelType` argument + hard-coded defaults

### Secondary

Current secondary sources:

- metadata custom funnel contexts in `meta.funnel_contexts`
- hard-coded mode defaults in `DEFAULT_CONTEXTS`

### Fallback

Current fallback values:

- `'retail'` default from `useFunnelPreference()`
- `'retail'` default from `/api/v1/funnel-os`
- hard-coded `retail/recruitment/upgrade` context definitions

### Conflict Rule

Current runtime rule is consumer-local, not system-wide:

1. UI preference hook:
   - localStorage wins
   - fallback `'retail'`
2. API:
   - query param wins
   - fallback `'retail'`
3. funnel context provider:
   - explicit `funnelType` argument wins
   - metadata custom context overrides defaults for that mode
   - defaults fill the rest
4. content heuristics:
   - industry heuristic branches independently

### Verdict

`NO CANONICAL AUTHORITY`

## Summary Table

| Projection | Primary | Secondary | Fallback | Conflict Rule |
| --- | --- | --- | --- | --- |
| `InterviewProfileSnapshot` | `BrandInterview.answers` during live capture; `BrandProfile` for confirmed downstream reads | `BrandInterview.extractedProfile` | `metadata.brand_profile` | phase-specific; canonical services prefer `BrandProfile`, legacy pages prefer metadata |
| `AudienceSnapshot` | `BrandProfile.targetAudience` / `audiencePainPoints` | `BrandInterview.extractedProfile` audience fields | `metadata.brand_profile`, onboarding metadata | downstream services prefer `BrandProfile`; onboarding remains competing side-channel |
| `BusinessContextSnapshot` | `BrandProfile` | `BrandInterview.extractedProfile` | `metadata.brand_profile`, `metadata.brand_positioning` | canonical services prefer `BrandProfile`; some pages override with legacy fields |
| `BusinessModeSnapshot` | none | consumer-local sources | `'retail'` and hard-coded defaults | no canonical winner; precedence is per consumer |
