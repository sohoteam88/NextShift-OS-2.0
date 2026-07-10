# Brand Intelligence Strategy Review

This is a strategy review only. No code changes were made.

## Final Conclusion

The document’s recommended direction is correct: **Option C, Brand Intelligence Layer**.

That is the best match for the current product shape:

- `Brand Builder` already owns workflow and progression.
- `Brand DNA Studio` already owns intelligence behaviors.
- `BrandProfile` is already the canonical data source.

The missing piece is not strategic clarity. The missing piece is an actual dedicated intelligence layer with its own route, UI, and migration plan.

## Current State

### Workflow Authority

`Brand Builder` owns:

- Interview
- Profile
- Strategy
- Calendar
- Progression

### Intelligence Authority

`Brand DNA Studio` owns:

- DNA Health
- Advisor
- Regeneration
- Snapshot Restore
- Versioning

### Data Authority

`BrandProfile` is canonical, but supporting stores still exist:

- `brandInterview`
- `brand_dna_versions`
- metadata snapshots in `user.metadata`

## Strategy Option Review

### Option A: Full Merge

Status: not recommended.

Reason:

- It would create a very large `Brand Builder` surface.
- Intelligence features could become buried inside a workflow-heavy product.
- This would be a broad refactor for limited clarity gain.

### Option B: Dual Domain

Status: workable, but not ideal long term.

Reason:

- It matches the current split, but keeps two product identities.
- It preserves the current user confusion risk.
- It is cheaper to keep, but it does not resolve the architecture tension.

### Option C: Intelligence Platform

Status: recommended.

Reason:

- It keeps workflow clean.
- It gives intelligence a dedicated home.
- It scales better than merging everything into the workflow surface.

## Why Option C Fits the Product

The cadence is different:

- Workflow features are used frequently.
- Intelligence features are used periodically.

That split is real in the codebase already:

- `Brand Builder` handles day-to-day edits and progression.
- `Brand DNA Studio` handles scoring, regeneration, advisor output, and recovery features.

So the long-term architecture should not force those into the same primary screen.

## Canonical Future Route Model

The proposed future model is coherent:

- `/brand-builder/profile`
- `/brand-builder/strategy`
- `/brand-builder/calendar`
- `/brand-builder/intelligence`

This is the right direction if the product wants one workflow shell with a separate intelligence sub-area.

## Migration Readiness

The strategy is sound, but the implementation is blocked by missing parity.

Before `/brand-dna` can retire, these capabilities must move or be recreated:

- DNA Health
- Advisor
- Regeneration
- Version Restore

At the moment, those are still concentrated in `BrandDNAStudio`.

## Architecture Assessment

### What works now

- A single canonical data source already exists: `BrandProfile`.
- Workflow and intelligence responsibilities are already distinguishable.
- `brand-builder` is already the right place for the user-facing progression model.

### What is missing

- A real `Brand Intelligence` module
- A real `/brand-builder/intelligence` surface
- A migration contract for the four intelligence capabilities
- A retirement plan for `BrandDNAStudio`

## Recommended Direction

Proceed with Option C.

Suggested order:

1. Define a `Brand Intelligence` module.
2. Define the `/brand-builder/intelligence` route and UI.
3. Move DNA Health, Advisor, Regeneration, and Version Restore into that layer.
4. Keep `/brand-dna` as a soft-retirement surface until parity is complete.
5. Only then consider removing `BrandDNAStudio`.

## Risk Assessment

Medium.

The strategic direction is good, but the migration is not small:

- There is still a live legacy surface.
- The intelligence behaviors are still concentrated in one studio component and its supporting services.
- The canonical route does not yet exist in the tree.

## Bottom Line

The current architecture should evolve toward:

- one workflow domain
- one intelligence layer
- one canonical data source

In practice that means:

- `Brand Builder` stays the workflow authority
- `Brand Intelligence` becomes a dedicated layer
- `BrandProfile` remains the data authority

That is the cleanest fit for the codebase you have today.
