# Brand Domain Authority Audit

Scope:

- `src/app/(auth)/brand-dna/**`
- `src/app/(auth)/brand-builder/**`
- `src/modules/brand-dna/**`
- `src/modules/brand-builder/**`

Audit only. No deletion. No redirects. No migration.

## Final Conclusion

The Brand Domain is split across two authorities:

- `Brand Builder` owns workflow and user progression.
- `Brand DNA Studio` owns brand intelligence and analysis.

So the current model is not a single route or single component owner. It is:

- **Workflow authority:** `brand-builder`
- **Intelligence authority:** `brand-dna`

That means `/brand-dna` is still the canonical owner of brand analysis capabilities for now, while `/brand-builder/profile` and the rest of `brand-builder` own the guided workflow.

## 1. Capability Inventory

Capabilities inside `BrandDNAStudio`:

- DNA health scoring
- Regeneration
- Advisor recommendations
- Brand DNA editing
- Brand identity editing
- Audience editing
- Messaging editing
- Content editing
- Offer editing
- Visual editing
- Interview gating / brand interview prerequisite
- Snapshot restore / versioning support

## 2. Canonical Coverage Matrix

| Capability | `/brand-builder` | `/brand-builder/profile` | Coverage |
| --- | --- | --- | --- |
| Brand identity editing | YES | YES | FULL |
| Audience editing | YES | YES | FULL |
| Messaging editing | YES | YES | FULL |
| Offer editing | YES | YES | FULL |
| Visual editing | YES | YES | FULL |
| Interview flow | YES | PARTIAL | PARTIAL |
| Content pillar / strategy setup | YES | PARTIAL | PARTIAL |
| DNA health scoring | NO | NONE | NONE |
| Regeneration | NO | NONE | NONE |
| Advisor recommendations | NO | NONE | NONE |
| Snapshot restore / versioning | NO | NONE | NONE |

Notes:

- `/brand-builder/profile` covers the core data-entry surface for brand identity.
- The broader `/brand-builder` workflow covers progression and setup steps.
- The analytics/intelligence behaviors remain concentrated in `BrandDNAStudio`.

## 3. Ownership Matrix

| Capability | Canonical Owner | Legacy Owner |
| --- | --- | --- |
| Brand identity editing | `/brand-builder/profile` | `/brand-dna` |
| Audience editing | `/brand-builder/profile` | `/brand-dna` |
| Messaging editing | `/brand-builder/profile` | `/brand-dna` |
| Offer editing | `/brand-builder/profile` | `/brand-dna` |
| Visual editing | `/brand-builder/profile` | `/brand-dna` |
| Interview flow | `/brand-builder/step/interview` | `/brand-dna` |
| Content strategy setup | `/brand-builder/step/strategy` / `/brand-builder/calendar` | `/brand-dna` |
| DNA health scoring | none | `/brand-dna` |
| Regeneration | none | `/brand-dna` |
| Advisor recommendations | none | `/brand-dna` |
| Snapshot restore | none | `/brand-dna` |

## 4. Data Ownership Analysis

Answer: **NO**, the three concepts do not share a single storage source in practice.

What exists now:

- `BrandProfile` table is the primary canonical store for brand DNA data.
- `user.metadata.brand_profile` is still used as a legacy fallback.
- `brandInterview` stores interview state and extracted profiles.
- `brand_dna_versions` is still stored in `user.metadata`.

So:

- Brand DNA, Brand Profile, and Brand Interview are related, but they are not a single unified data source.
- `brandProfile` is canonical for the current read/write path.
- `brandInterview` and metadata snapshots are supporting stores.

## 5. Migration Difficulty Matrix

| Capability | Difficulty |
| --- | --- |
| DNA Health | HIGH |
| Advisor | HIGH |
| Regeneration | HIGH |

Why:

- These behaviors are tightly coupled to `BrandDNAStudio`.
- They depend on validation, regeneration, and legacy snapshot semantics that are not yet fully mirrored in `brand-builder/profile`.
- Moving them would require either a richer canonical brand builder surface or a new dedicated analysis layer.

## 6. Retirement Blockers

`/brand-dna` cannot retire yet because:

- `BrandDNAStudio` still owns DNA health scoring.
- `BrandDNAStudio` still owns regeneration.
- `BrandDNAStudio` still owns advisor recommendations.
- `BrandDNAStudio` still owns snapshot/version restore behavior.
- `brand-builder/profile` does not yet provide a full equivalent studio experience.
- Historical docs and runtime helpers still recognize `/brand-dna` as a live brand surface.

## 7. Target Architecture

One Brand Domain:

- `brand-builder` is the user-facing workflow domain.
- `brand-dna` is the brand intelligence domain.

One Brand Authority:

- `BrandProfile` should remain the canonical data source.

One Brand Route:

- Not ready yet.

If the system is eventually collapsed to one route, it must first absorb:

- health scoring
- regeneration
- advisor output
- version restore

That is the missing parity gap.

## 8. Recommended Migration Order

1. Keep `/brand-dna` active for intelligence and analysis.
2. Continue strengthening `/brand-builder/profile` as the user-editable canonical profile surface.
3. Decide whether health/advisor/regeneration should move into a dedicated brand-builder intelligence tab or stay in a separate brand-dna studio.
4. Only after that, evaluate whether `/brand-dna` can be soft-retired.

## 9. Capability Notes

### `BrandDNAStudio`

Current runtime capabilities:

- direct DNA fetch/save/regenerate
- health validation
- recommendation generation
- profile editing with autosave
- version snapshotting

### `Brand Builder`

Current runtime capabilities:

- guided interview
- profile confirmation
- content strategy setup
- content calendar generation
- stepwise workflow progression

## 10. Final Recommendation

Do not retire `/brand-dna` yet.

Current best model:

- `/brand-builder` = workflow authority
- `/brand-dna` = intelligence authority
- `BrandProfile` = shared canonical data store

The blocker is feature parity, not route cleanliness.

## Validation

- `pnpm type-check` passed
- `pnpm build` passed

The build still reports the repository’s existing `posthog-js` warning, `react-hooks/exhaustive-deps` warnings in AI components, and Prisma empty `DATABASE_URL` logs during static generation. These did not block the build.
