# Interview Authority Conflict Report

Scope: discovery only. This report records where current sources can disagree, and which source wins in actual runtime.

## 1. InterviewProfileSnapshot Conflicts

### Conflict A

- `BrandInterview.answers`
- `BrandInterview.extractedProfile`

#### Runtime winner

For extraction input:

- `answers.__dialogue.messages` wins
- else `voice transcript`
- else raw `answers`

For post-extraction consumers:

- `extractedProfile` wins over raw answers because downstream post-extraction flows consume extracted output, not question-by-question answers

### Conflict B

- `BrandProfile`
- `metadata.brand_profile`

#### Runtime winner

For canonical service readers:

- `BrandProfile` wins

For legacy builder pages:

- `metadata.brand_profile` wins because those pages do not read `BrandProfile`

#### Conflict verdict

No single global winner. Winner depends on which consumer path is used.

## 2. AudienceSnapshot Conflicts

### Conflict A

- `preferred_audience` dialogue slot
- `extractedProfile.target_audience`

#### Runtime winner

After extraction:

- `extractedProfile.target_audience` wins for any flow that uses extraction output

The raw slot value remains inside dialogue state but is not treated as downstream read authority.

### Conflict B

- `BrandProfile.targetAudience`
- `metadata.brand_profile.target_audience`

#### Runtime winner

For `brandDnaService`, `BrandContextProvider`, and brand health:

- `BrandProfile.targetAudience` wins

### Conflict C

- `BrandProfile.targetAudience`
- onboarding metadata `metadata.goals.target_audience` / `metadata.target_audience`

#### Runtime winner

No universal runtime reconciliation exists.

Observed behavior:

- onboarding flows read onboarding metadata
- brand context flows read `BrandProfile` first

#### Conflict verdict

Competing parallel authorities. No automatic winner across the full runtime.

## 3. BusinessContextSnapshot Conflicts

### Conflict A

- `BrandProfile`
- `metadata.brand_profile`

#### Runtime winner

For canonical service readers:

- `BrandProfile` wins

#### Evidence

- `brandDnaService.getBrandDNA()`
- `BrandContextProvider.getBrandContext()`
- `brand-health-projection.resolveBrandDNA()`

### Conflict B

- `BrandProfile.contentPillars`
- `metadata.brand_profile.contentPillars`

#### Runtime winner

In `brand-builder/calendar/page.tsx`:

- `legacyBrandProfile.contentPillars` wins if present
- otherwise canonical `brandDNA.content.contentPillars`

This is a page-local override of canonical precedence.

### Conflict C

- generated strategy from canonical DNA
- `metadata.brand_profile.contentStrategy`

#### Runtime winner

In `brand-builder/calendar/page.tsx`:

- `legacyBrandProfile.contentStrategy` wins if present
- otherwise generated strategy object from canonical DNA

### Conflict D

- `BrandProfile.brandPositioning`
- `metadata.brand_positioning`

#### Runtime winner

No global reconciliation exists.

Observed behavior:

- onboarding overview reads `metadata.brand_positioning`
- canonical brand context readers use `BrandProfile`

#### Conflict verdict

Parallel read authorities by product area.

## 4. BusinessModeSnapshot Conflicts

### Conflict A

- `localStorage['nextshift.currentFunnel']`
- query param `type`

#### Runtime winner

No shared resolver exists.

- UI funnel selector path uses localStorage winner
- `/api/v1/funnel-os` uses query param winner

### Conflict B

- explicit `funnelType` argument
- `meta.funnel_contexts[funnelType]`
- hard-coded default context

#### Runtime winner

In `getFunnelContext()`:

1. explicit `funnelType` selects the mode bucket
2. custom metadata context overrides defaults for matching fields
3. defaults fill missing fields

### Conflict C

- selected funnel mode
- industry heuristic branch in `content-pillar-service`

#### Runtime winner

No direct reconciliation exists.

Industry heuristics can branch independently of funnel mode selection.

### Conflict verdict

`NO CANONICAL AUTHORITY`

## 5. Cross-Cutting Conflict Pattern

The repo currently exhibits four conflict patterns:

1. **canonical-with-fallback**
   - `BrandProfile -> metadata.brand_profile`
2. **legacy-only surface**
   - builder pages using `metadata.brand_profile` directly
3. **page-local merge**
   - calendar page merging canonical and legacy fields
4. **parallel unresolved authority**
   - onboarding metadata and business mode sources

## 6. Conflict Conclusion

The closest thing to a current global rule is:

- for canonical service-backed consumers, `BrandProfile` usually wins over `metadata.brand_profile`

But that rule does not apply to:

- legacy builder pages
- onboarding metadata
- business mode
- page-local merge surfaces

So the current runtime conflict model is mixed, not uniform.
