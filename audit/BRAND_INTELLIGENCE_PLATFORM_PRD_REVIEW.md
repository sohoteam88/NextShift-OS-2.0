# Brand Intelligence Platform PRD Review

This is a PRD review only. No code changes were made.

## Final Conclusion

The PRD is directionally correct and consistent with the current architecture audits.

It correctly identifies the target state as:

- `Brand Builder` as the workflow shell
- `Brand Intelligence` as a first-class layer inside `Brand Builder`
- `BrandProfile` as the canonical data source

The main issue is not the vision. The issue is that the implementation plan assumes a dedicated `/brand-builder/intelligence` surface and supporting intelligence module that do not exist yet.

## What the PRD Gets Right

- It preserves `BrandProfile` as the source of truth.
- It keeps `brandInterview` and `brand_dna_versions` as supporting stores.
- It separates frequent workflow actions from periodic intelligence actions.
- It defines a sensible long-term structure:
  - Profile
  - Strategy
  - Calendar
  - Video
  - Intelligence

## Architecture Assessment

The PRD matches the codebase reality better than a full merge would.

Current split:

- `Brand Builder` owns workflow and progression.
- `Brand DNA Studio` owns intelligence behaviors.

Target split proposed by the PRD:

- `Brand Builder` keeps workflow ownership.
- `Brand Intelligence` becomes the intelligence layer inside `Brand Builder`.

That is a coherent evolution path.

## Implementation Gaps

The PRD assumes these things will exist:

- `/brand-builder/intelligence`
- `Brand Intelligence` home view
- Intelligence tabs for Overview, Health, Advisor, Regeneration, and History
- Module migration for DNA Health, Advisor, Regeneration, and Version Restore

None of that exists in `src` yet.

## Data Architecture Review

The data model section is correct.

Current state:

- `BrandProfile` is canonical
- `brandInterview` supports interview extraction and onboarding
- `brand_dna_versions` stores version history

That means the PRD does not require a new canonical data source. It requires a new projection and UI layer on top of the existing one.

## Permission Model Review

The PRD’s role-based capability split is plausible:

- Explorer: Health only
- Builder: Health + Advisor
- Operator: Health + Advisor + Regeneration
- Leader: Health + Advisor + Regeneration + History

This is consistent with the product’s broader progression model.

## Migration Plan Review

The migration phases are reasonable:

1. Build the intelligence route.
2. Move DNA Health.
3. Move Advisor.
4. Move Regeneration.
5. Move Version History.
6. Soft-retire `/brand-dna`.
7. Hard-retire `BrandDNAStudio`.

The plan is valid, but it is still a roadmap, not a near-term implementation spec.

## Risk Assessment

Medium.

Why:

- `BrandDNAStudio` still owns the advanced intelligence behavior today.
- There is no implementation of the new intelligence route yet.
- The PRD assumes parity migration work that has not started.

## Bottom Line

The PRD is a good target-state document.

It should be treated as the north star for a future `Brand Intelligence` layer, not as evidence that `/brand-dna` can retire now.

Recommended interpretation:

- Keep the current Brand DNA Studio alive until the intelligence layer exists.
- Build the intelligence layer inside Brand Builder.
- Migrate features one by one.
- Retire `/brand-dna` only after parity is complete.
