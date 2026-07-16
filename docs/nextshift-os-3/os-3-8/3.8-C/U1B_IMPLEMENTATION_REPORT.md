# U1B Approved Dead-code Removal — Implementation Report

## Identity

- Task: `U1B — Approved Dead-code Removal`
- Authorized exact baseline: `f229f7ef1ac233942572fb732283bd30d6574313`
- Branch: `refactor/os-3.8-u1b-dead-code-removal`
- U1A inventory: `docs/nextshift-os-3/os-3-8/3.8-C/U1A_DEAD_CODE_INVENTORY.md`
- Approved IA: `docs/nextshift-os-3/os-3-8/3.8-C/U2_INFORMATION_ARCHITECTURE.md`
- Steven governance source: `docs/nextshift-os-3/os-3-8/approvals/STEVEN_IA_APPROVAL.md`
- Verification policy: `actual_checks_required`
- Recorded at: `2026-07-16T12:17:18Z`

This change is limited to the eight exact files approved for a removal PR. The approval artifact does not itself authorize deletion; this U1B branch revalidated every candidate at the current baseline and prepares a Draft PR for exact-head Architecture Review. No directory or wildcard deletion was used.

## Per-file removal evidence

The searches covered static imports, `import()`, `React.lazy`, `next/dynamic`, `require`, barrel and package exports, App Router pages/layouts, canonical routes, navigation, missions, journeys, feature flags, string lookups, tests, E2E, stories, fixtures, documentation, APIs, transitive dependencies, and Git history. After removal, a runtime-only repository search for every candidate name returns zero.

| ID | Removed path | Exported symbols | Consumer and closure evidence | Documentation/history context | Replacement authority, risk, and conclusion |
|---|---|---|---|---|---|
| C01 | `src/modules/content-engine/components/ContentEngineDashboard.tsx` | `ContentEngineDashboard` | No consumer, route mount, dynamic/lazy load, export, flag, test, story, or fixture. Its only candidate dependencies were C04. Props/query concepts `initialPlatform` and `autoGenerate` had no callers. | Historical docs retain the name as evidence. Last relevant commits: `261c5a7` (2026-06-19), `d80fd81` and `da0f3c1` (2026-06-16). | `ContentCommandCenter` owns generation, current editor value, copy, save/retry and calendar behavior with tested validation boundaries. Risk was an undiscovered mount; exhaustive search found none. Removed with C04. |
| C04 | `src/modules/content-engine/contentAdvisor.ts` | `ContentAdvisorTip`, `getContentAdvisorTips` | Only static consumer was C01; no independent dynamic, route, export, API, test, story, fixture, flag, or package consumer. | Historical documentation references remain valid. Last relevant commit: `224c1f8` (2026-06-13). | Candidate-only helper with no active authority. Removing it separately would break C01, so it was removed atomically with C01. |
| C04 | `src/modules/content-engine/contentValidator.ts` | `validateContent` | Only static consumer was C01; no independent dynamic, route, export, API, test, story, fixture, flag, or package consumer. | Historical documentation references remain valid. Last relevant commit: `224c1f8` (2026-06-13). | Active editor validation is owned by current E1 contracts and components. Removed atomically with C01. |
| C02 | `src/modules/content-engine/components/ContentDashboard.tsx` | `ContentDashboard` | No runtime consumer or export. Its only candidate dependency was C05; it also referenced protected C06/C07 and an active shared mission hook. The inactive `generate=smart` links have no reader on the canonical page. | Historical documentation remains evidence. Last relevant commits: `2b9147f` (2026-06-16) and `1f45f34` (2026-06-15). | Current `/content-engine` composition mounts `ContentCommandCenter` and `ContentLibrary`. Risk was deleting latent publishing/scoring capability; C06 and C07 are explicitly retained unchanged. Removed with C05 only. |
| C05 | `src/modules/content-engine/hooks/useContentEngine.ts` | `useContentEngine` | Only consumer was C02. It was the only consumer of the C05 strategy/pillar service chain. No route, dynamic import, export, package, API, test, story, fixture, or flag reached it. | Historical docs remain valid. Last relevant commits: `2911266` (2026-06-17) and `1f45f34` (2026-06-15). | Active generation uses `contentEngineService` and `contentGenerators.ts`; the similarly named local C01 hook is also removed. Removed with C02 and the two C05 services. |
| C05 | `src/modules/content-engine/services/content-strategy-service.ts` | `generateContentStrategy` | Only consumer was the removed C05 hook; its only candidate dependency was the pillar service. | Historical docs remain valid. Last relevant commit: `1f45f34` (2026-06-15). | Candidate-only strategy implementation; active generation does not import it. Removed in the closed C02/C05 set. |
| C05 | `src/modules/content-engine/services/content-pillar-service.ts` | `generateContentPillars`, `getPillarById` | Only consumer of `generateContentPillars` was the removed strategy/hook chain; `getPillarById` had no consumer. No runtime registration or export was found. The same symbol name in `contentGenerators.ts` is a distinct, preserved active implementation. | Historical docs remain valid. Last relevant commit: `1f45f34` (2026-06-15). | Candidate-only pillar implementation. Removed in the closed C02/C05 set without touching active generators. |
| C03 | `src/modules/ai/components/ContentHistory.tsx` | `ContentHistory` | No import, route mount, dynamic/lazy load, AI barrel export, package export, flag, test, story, or fixture. Its API calls did not make the component reachable. | E2 documents it only as changed historical evidence; that reference is not runtime authority. Last relevant commits: `405a720` (2026-07-15) and `ec45c30` (2026-06-07). | `ContentLibrary` is the mounted tenant/owner-safe list/read/edit/delete/copy authority. API contracts remain unchanged. Removed as a standalone closed set. |

Documentation references were intentionally not rewritten: U1A, Blueprint, audits, and W1 reports describe the historical evidence and remain accurate provenance after deletion.

## Dependency sets

### Set A — C01 + C04

`ContentEngineDashboard` was the sole consumer of `contentAdvisor` and `contentValidator`; no edge entered the set from runtime code. Removing all three files closes the entire candidate graph. Current generation/editor/save/copy/calendar/validation behavior stays under `ContentCommandCenter`.

### Set B — C02 + C05

`ContentDashboard` was the sole consumer of `useContentEngine`, which was the sole entry into the candidate strategy and pillar services. No runtime edge entered the candidate set. C02 also read protected shared/latent modules, but those edges point outward: deleting C02 does not authorize deleting C06, and C07 remains live through `content-performance/services/performance-service.ts`.

### Set C — C03

`ContentHistory` had no incoming runtime edge or export and no candidate-only dependency requiring further removal. The E2 report reference is governance history only. `ContentLibrary` and all Content APIs remain the active authorities.

## Behavioral parity evidence

- `/content-engine` still statically mounts `ContentCommandCenter` and `ContentLibrary`.
- The active command center retains generation, editor, current-value copy, save/retry, calendar behavior, and tested edit/save race handling.
- Active generation continues to use `contentEngineService`/`contentGenerators.ts`; no active reader uses `mode=generator`, `generate=smart`, `initialPlatform`, or `autoGenerate`.
- `ContentLibrary` retains list/read/edit/delete/copy, exact-item refresh, retry, focus, session isolation, tenant/owner boundaries, and API ownership.
- `/admin/content`, Content APIs, and compatibility/onboarding redirect pages are unchanged.

## Explicit exclusions

The following protected paths and authorities have no diff:

- C06: `src/modules/content-publishing/hooks/usePublishingCenter.ts`
- C06: `src/modules/content-publishing/services/publishing-service.ts`
- C06: `src/modules/content-publishing/types/publishing.types.ts`
- C07: `src/modules/content-engine/services/content-scoring-service.ts`
- `src/app/(auth)/content-engine/page.tsx`
- `src/modules/content-engine/components/ContentCommandCenter.tsx`
- `src/modules/content-library/components/ContentLibrary.tsx`
- `src/app/(auth)/admin/content/page.tsx` and the Admin Content Center
- Content APIs and E1/E2 tests
- Compatibility/onboarding redirect pages
- `PIPELINE_MANIFEST.json`, Pipeline code, approved IA, Steven approval, Prisma, routes, and navigation

Baseline and post-removal SHA-256 checks are identical for all named protected files. C07 remains imported by `src/modules/content-performance/services/performance-service.ts`.

## Changed files

Deleted exactly eight files (894 lines):

1. `src/modules/content-engine/components/ContentEngineDashboard.tsx`
2. `src/modules/content-engine/contentAdvisor.ts`
3. `src/modules/content-engine/contentValidator.ts`
4. `src/modules/content-engine/components/ContentDashboard.tsx`
5. `src/modules/content-engine/hooks/useContentEngine.ts`
6. `src/modules/content-engine/services/content-strategy-service.ts`
7. `src/modules/content-engine/services/content-pillar-service.ts`
8. `src/modules/ai/components/ContentHistory.tsx`

Added this report only. No replacement product implementation was added.

## Validation evidence

### Static verification

- Candidate runtime references after deletion: **0**.
- Broken import/export check: **PASS** through TypeScript and production build.
- Active route composition: **PASS**; the page still imports and mounts both active W1 surfaces.
- Protected C06/C07, active surfaces, admin route, and five compatibility redirects: **PASS**, byte-identical to baseline.
- Diff scope and whitespace: **PASS**; exact eight deletions plus this report only.

### Engineering gates

| Command | Result |
|---|---|
| `pnpm exec vitest run <8 focused Content/API test files>` | **PASS** — 8 files, 67 tests |
| `pnpm type-check` | **PASS** |
| `pnpm lint` | **PASS** — 0 errors, 419 existing warnings |
| `pnpm test` | **PASS** — 98 files passed, 7 skipped; 536 tests passed, 44 skipped |
| `pnpm build` | **PASS** — production bundle includes `/content-engine` and `/admin/content`; missing local `DATABASE_URL` produced expected data-fetch diagnostics during static generation but did not fail the build |
| `pnpm lint:boundaries:check` | **PASS** — generated boundary config is in sync |
| `git diff --check` | **PASS** |

### Browser evidence

- `pnpm exec playwright test tests/e2e/content-engine.spec.ts tests/e2e/content-library.spec.ts --list`: **PASS**, 14 tests discovered across 2 files.
- Local execution was attempted against a local development server. It stopped at the shared login helper because this checkout has neither `.env.local` nor `.env.e2e`; the default placeholder account did not authenticate. The observed failures occurred before `/content-engine` loaded and are recorded as an environment limitation, not as passing browser evidence.
- The Draft PR uses `actual_checks_required`; GitHub Type Check/Lint/Build, Tests, E2E Secret Check, and E2E Tests must all run and pass at the exact PR head. They are pending until the Draft PR is created and are authoritative for executable E2E validation.

## Governance boundary

- This Draft PR does not authorize merge or mark U1B completed.
- U3 and E3 were not started.
- The approved IA, Manifest, Pipeline, navigation, routes, database schema, and production state were not changed.
- No deployment, tag, release, production migration, or production access was performed.
