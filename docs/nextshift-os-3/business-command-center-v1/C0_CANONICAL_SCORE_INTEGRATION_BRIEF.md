# C0 Canonical Business Score Integration Brief

Version: 1.0

Status: Architecture direction accepted; implementation pending

Last Updated: 2026-07-13

---

## Decision

Reject the app-layer score-formula mirror in PR #63. Accept the intent of option 2, with one necessary refinement: do **not** export the existing `createBusinessScore()` aggregate helper as the dashboard API.

`createBusinessScore()` is intentionally coupled to a `DecisionEngineV1Snapshot` and a `GrowthRevenueV1Snapshot`. The Next.js runtime does not create or persist either snapshot chain today, so exporting that function and adding a path alias would not make the dashboard able to call it. Building all six upstream aggregates solely to render C0 would turn a small read-only card into an unapproved runtime-integration project.

Instead, extract and export the canonical, pure score-calculation policy from the domain module. `createBusinessScore()` and the dashboard service must both call that one policy. This removes formula and score-band drift without claiming that the dashboard reads a live, persisted `BusinessCommandCenterV1` aggregate.

PR #63 must not be merged as C0 in its current form. Its card layout, route shape, and test fixtures may be reused, but its local `createBusinessScore()` mirror must be deleted in the replacement implementation.

## Why this is the smallest correct option

| Option | Result |
| --- | --- |
| Merge the app-layer mirror | Reject. The score formula and threshold bands can drift from the domain owner. |
| Export the existing `createBusinessScore()` only | Reject. Its required domain snapshots do not exist in the production Next.js request path. |
| Extract a public domain score policy used by `createBusinessScore()` and the dashboard | Accept. One formula owner, no synthetic aggregate snapshots, and no package-wide runtime activation. |

This preserves the domain boundary in [ADR-001](../../architecture/ADR-001-domain-boundaries.md): score policy has one canonical owner, while the dashboard remains a read-only presentation consumer.

## Authorized implementation scope

The existing "do not touch `packages/`" constraint is lifted only for the following files and their directly related tests:

1. In `packages/domain/src/business-command-center-v1/`, extract a public pure function named `calculateBusinessScore` from the current `createBusinessScore()` implementation.
2. The function must accept only the values required by the formula: normalized-or-unit readiness and unit forecast confidence. It must return `scoreValue` and `scoreBand`.
3. Refactor the existing private aggregate helper to use `calculateBusinessScore`; it remains responsible for aggregate-specific identifiers, factors, references, confidence, and explanation.
4. Export the new policy through the existing `business-command-center-v1` and root domain barrels.
5. Add the `@nextshift/domain` TypeScript path mapping required for the server-side dashboard service to import the policy.
6. Replace PR #63's app-local formula and band thresholds with the domain import. Keep the score endpoint read-only and preserve its existing null-on-fallback behavior.
7. Add or update focused domain and dashboard-service tests proving both consumers produce identical scores at the `59/60` and `79/80` band boundaries.

## Input provenance and naming rules

The dashboard must make its input mapping explicit in its service, rather than relabeling an unrelated value as a forecast:

| Canonical policy input | Dashboard source | Rule |
| --- | --- | --- |
| `readinessScore` | `analytics.projection.readiness.value` | Normalize using the policy contract; retain the source in the returned factors. |
| `forecastConfidence` | `crmCenterService.getCommandCenter(...).revenueForecast.confidenceScore` | Divide the existing `0..100` CRM forecast-confidence score by `100` before passing it to the policy, and retain the forecast source in the returned factors. |

The existing analytics `growth.value` is a Growth Loop aggregate, not revenue forecast confidence; it must not be renamed and passed to the policy. The dashboard service may add an injected CRM command-center loader and load it in parallel with the existing recommendation context. A missing tenant, CRM load failure, or invalid confidence value follows C0's existing logged `null` fallback.

There is no production `BusinessCommandCenterV1` repository, `DecisionEngineV1` repository, or `GrowthRevenueV1` repository wired into `src/`. Therefore C0 must not fabricate six upstream snapshots or represent its response as a persisted Command Center aggregate. Full runtime activation of that package chain is a separate architecture project.

## Required release-standard clarification

For C0, the intended meaning of release standard #1 is:

> The dashboard Business Score is calculated by the exported canonical domain score policy that `createBusinessScore()` itself uses; the app must not hardcode or mirror the formula or score bands.

This replaces the impossible literal claim that the dashboard reads data directly from the aggregate helper. It retains the architectural intent—one formula owner—while accurately describing the production runtime.

## Explicit non-goals

- Do not wire or persist the full Business Foundation → Business Brain → Decision Engine → Conversation → Creative Studio → Growth & Revenue → Command Center aggregate chain.
- Do not create synthetic snapshots merely to invoke `BusinessCommandCenterV1.create()`.
- Do not alter Business Score factors, explanation copy, endpoint authorization, or UI placement beyond replacing the formula owner.
- Do not merge PR #63 without the replacement of its app-layer formula mirror.

## Acceptance criteria

1. No Business Score calculation or `80`/`60` score-band branching remains in `src/`; the dashboard calls `calculateBusinessScore` from `@nextshift/domain`. The explicit CRM percentage-to-unit conversion is permitted.
2. `createBusinessScore()` in the domain package calls the same exported policy.
3. Domain tests cover normalization plus `needs_attention`/`ready`/`strong` boundaries; dashboard-service tests prove it delegates rather than recomputes, passes the CRM forecast confidence as a unit value, and returns `null` on CRM fallback.
4. The dashboard endpoint remains authenticated, read-only, tenant-safe, and degrades to `null` through the existing fallback logger.
5. `pnpm --filter @nextshift/domain test`, `pnpm type-check`, `pnpm lint`, `pnpm test`, and `pnpm build` pass.

## Handoff

Implement this as a replacement for PR #63, then mark C0 complete in the OS 3.7 blueprint only after the acceptance criteria above pass. C1 remains gated on Steven's separate one-page information-architecture decision.
