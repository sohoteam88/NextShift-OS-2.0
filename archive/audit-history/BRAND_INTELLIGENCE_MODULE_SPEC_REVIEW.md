# Brand Intelligence Module Specification Review

This is a spec review only. No code changes were made.

## Final Conclusion

The specification is directionally correct and matches the current architecture direction.

It cleanly defines the target state:

- `Brand Builder` keeps workflow ownership.
- `Brand Intelligence` becomes the dedicated intelligence layer.
- `BrandProfile` remains the canonical data source.

The main gap is execution scope. The spec describes the right future module, but `src/modules/brand-intelligence/` and `/brand-builder/intelligence` do not exist yet, so this is still a target architecture, not an implemented surface.

## What the Spec Gets Right

- It separates workflow concerns from intelligence concerns.
- It keeps brand analysis, advisor, regeneration, and version history in one domain.
- It avoids creating a second canonical data source.
- It preserves the current supporting stores:
  - `brandInterview`
  - `brand_dna_versions`
  - metadata snapshots

That is the correct shape for the next phase.

## Architecture Assessment

The spec resolves the current tension in the product:

- `Brand Builder` is for user progression and guided setup.
- `Brand DNA Studio` is for intelligence behavior.

The proposed `Brand Intelligence` module is the right long-term container for:

- brand health
- advisor recommendations
- regeneration
- version history

That gives the system a cleaner boundary than the current split between workflow and intelligence surfaces.

## Implementation Gaps

The spec assumes these runtime pieces will exist:

- `src/modules/brand-intelligence/`
- `BrandIntelligenceSnapshot`
- `useBrandHealth`
- `useBrandAdvisor`
- `useBrandRegeneration`
- `useBrandVersions`
- `/brand-builder/intelligence`

None of those are present yet in the codebase.

So this should be treated as the contract for V6.4E, not as evidence that migration can start immediately.

## Data Model Review

The data model direction is sound.

Current canonical source:

- `BrandProfile`

Supporting stores:

- `brandInterview`
- `brand_dna_versions`
- metadata snapshots

That means the spec does not need a new persistence source. It needs a new projection and UI layer that reads the existing data consistently.

## Permission Model Review

The role split is sensible:

- Explorer: Health only
- Builder: Health + Advisor
- Operator: Health + Advisor + Regeneration
- Leader: Health + Advisor + Regeneration + History

That matches the existing progression model and creates a reasonable capability ladder for intelligence features.

## Migration Scope Review

The migration contract is intentionally correct in one important way:

- no capability migration yet
- no route retirement yet
- no redirects yet

That makes the document safe as a design contract.

The real implementation work still needs a later phase that:

1. creates the module
2. defines the snapshot
3. builds the route
4. migrates capabilities one by one
5. retires the old surface only after parity

## Risk Assessment

Medium.

Why:

- the spec assumes a future module boundary that is not present today
- `BrandDNAStudio` still owns the advanced intelligence behavior
- there is no `Brand Intelligence` runtime surface yet

That is not a problem in the spec itself. It is just a sign that the document is still a roadmap-level contract.

## Bottom Line

Use this spec as the north star for the future `Brand Intelligence` module.

Do not treat it as proof that `/brand-dna` can be retired now. The correct next step is to implement the module and route first, then migrate capabilities incrementally.
