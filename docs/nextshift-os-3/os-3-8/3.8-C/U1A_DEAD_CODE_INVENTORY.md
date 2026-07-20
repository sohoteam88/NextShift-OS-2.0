# U1A Dead-code Inventory

## Status and authority

- Authorized baseline: `46001c987629df1ac9a602588ee6ee429aa473e3`
- Inventory branch: `docs/os-3.8-u1a-dead-code-inventory`
- Scope: OS 3.8 Wave 2 task U1A only
- Authority sources: `AGENTS.md`, `docs/nextshift-os-3/OS_3_8_BLUEPRINT.md`, `docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json`, `docs/nextshift-os-3/os-3-8/WAVE_EXECUTION_CONTRACT.md`, `docs/architecture/`, and `src/config/canonical-routes.ts`

**No deletion is authorized by this inventory.** `ORPHAN_CANDIDATE` means that repository evidence supports a future U1B removal proposal; it is not deletion approval. Every removal still requires the Architecture/Steven approval required by the Manifest and Blueprint.

## 1. Scope and method

This inventory examined Content-related pages, components, routes, APIs, dashboards, hooks, services, and redirect surfaces that appear inactive, duplicated, orphaned, or legacy. It followed references in both directions: from App Router and navigation registrations into components, and from candidate imports into their dependencies.

The investigation did not treat an empty static search as sufficient evidence. It also checked:

- App Router `page.tsx` mounts and Next.js redirects;
- static imports, dynamic `import()` calls, React lazy loading, and string references;
- canonical route registration, workspace configuration, sidebar/navigation, missions, journeys, and onboarding redirects;
- API consumers and server/client boundaries;
- barrel and package exports;
- unit/integration/E2E tests, stories, fixtures, and feature flags;
- architecture, Blueprint, audit, execution-contract, and implementation-report references;
- transitive consumers of candidate-only hooks and services.

No runtime execution, product edit, deletion, move, rename, navigation change, redirect creation, or Manifest transition was performed.

## 2. Reproducible search strategy

The following commands were run from repository root at the authorized baseline. They are intentionally broad enough to expose string-based and convention-based consumers.

```bash
git ls-files 'src/**' 'tests/**' 'docs/**'
find src/app -name page.tsx -print | sort
rg -n "ContentEngineDashboard|ContentDashboard|ContentHistory|ContentCommandCenter|ContentLibrary|AdminContentCenter" src tests docs
rg -n "import\\(|lazy\\(|dynamic\\(" src --glob '*.{ts,tsx}'
rg -n "content-engine|admin/content" src tests next.config.mjs --glob '*.{ts,tsx,mjs}'
rg -n "ContentEngineDashboard|ContentDashboard|ContentHistory" . --glob '*fixture*' --glob '*flag*' --glob '*.{stories,story}.{ts,tsx,js,jsx,mdx}'
rg -n "contentAdvisor|contentValidator|useContentEngine|content-strategy-service|content-pillar-service|usePublishingCenter|publishing-service|content-scoring-service" src --glob '*.{ts,tsx}'
rg -n "mode=generator|generate=smart|searchParams.*mode|initialPlatform|autoGenerate" src tests docs
rg -n "exports|files" package.json packages/*/package.json 2>/dev/null
git log -1 --format='%h %cs %s' -- <candidate-path>
```

The candidate symbol counts at this baseline were:

| Symbol | Source files containing symbol | Focused tests | Documentation files | Dynamic/lazy candidate references |
|---|---:|---:|---:|---:|
| `ContentEngineDashboard` | 1 | 0 | 6 | 0 |
| `ContentDashboard` | 1 | 0 | 1 | 0 |
| `ContentHistory` | 1 | 0 | 2 | 0 |
| `ContentCommandCenter` | 4 | 0 | 8 | n/a (statically mounted) |
| `ContentLibrary` | 8 | 2 | 2 | n/a (statically mounted) |
| `AdminContentCenter` | 3 | 0 | 0 | n/a (statically mounted) |

There are no story files in the repository, and the three inactive candidate symbols have no fixture or feature-flag reference.

## 3. Candidate summary

| ID | Exact path(s) / symbol | Classification | Confidence | Proposed U1B action | Approval required |
|---|---|---|---|---|---|
| C01 | `src/modules/content-engine/components/ContentEngineDashboard.tsx` / `ContentEngineDashboard` | `ORPHAN_CANDIDATE` | high | Propose removal after review of candidate-only helpers | Architecture + Steven |
| C02 | `src/modules/content-engine/components/ContentDashboard.tsx` / `ContentDashboard` | `ORPHAN_CANDIDATE` | high | Propose removal after query-parameter and publishing review | Architecture + Steven |
| C03 | `src/modules/ai/components/ContentHistory.tsx` / `ContentHistory` | `ORPHAN_CANDIDATE` | high | Propose removal after confirming E2 report does not require the component as evidence | Architecture + Steven |
| C04 | `src/modules/content-engine/contentAdvisor.ts`; `src/modules/content-engine/contentValidator.ts` | `ORPHAN_CANDIDATE` | high | Remove only with C01 if no extracted logic is required | Architecture + Steven |
| C05 | `src/modules/content-engine/hooks/useContentEngine.ts`; `src/modules/content-engine/services/content-strategy-service.ts`; `src/modules/content-engine/services/content-pillar-service.ts` | `ORPHAN_CANDIDATE` | high | Remove only with C02; do not include the shared scoring service | Architecture + Steven |
| C06 | `src/modules/content-publishing/hooks/usePublishingCenter.ts`; `src/modules/content-publishing/services/publishing-service.ts`; `src/modules/content-publishing/types/publishing.types.ts` | `UNCERTAIN` | medium | Do not remove in initial U1B; decide whether latent publishing capability is retained or separately retired | Architecture + Steven |
| C07 | `src/modules/content-engine/services/content-scoring-service.ts` | `KEEP` | high | Exclude from any candidate dependency sweep | No change proposed |
| C08 | `src/app/(auth)/content-engine/page.tsx` / route composition | `KEEP` | high | Keep as canonical active Content route | No change proposed |
| C09 | `src/modules/content-engine/components/ContentCommandCenter.tsx` / `ContentCommandCenter` | `KEEP` | high | Keep as E1 active editor/generation authority | No change proposed |
| C10 | `src/modules/content-library/components/ContentLibrary.tsx` / `ContentLibrary` | `KEEP` | high | Keep as E2 active library authority | No change proposed |
| C11 | `src/app/(auth)/admin/content/page.tsx`; `src/modules/admin/components/overview/ContentSection.tsx` / `AdminContentCenter` | `KEEP` | high | Keep distinct operator/admin metrics surface | No change proposed |
| C12 | `src/app/(auth)/ai/page.tsx`; `src/app/(auth)/ai/content-plan/page.tsx`; `src/app/(auth)/onboarding/first-content/page.tsx`; `src/app/(auth)/brand-builder/step/strategy/page.tsx`; `src/app/(auth)/brand-builder/step/calendar/page.tsx` | `KEEP` | medium | Keep compatibility/onboarding redirects unless a separate IA decision retires their entry contracts | Architecture approval for future change |

Classification totals: **KEEP 6**, **DUPLICATE 0**, **ORPHAN_CANDIDATE 5**, **UNCERTAIN 1** (12 candidate groups).

The three inactive UI surfaces have duplicate capability, but they are classified as `ORPHAN_CANDIDATE` rather than `DUPLICATE` because no runtime consumer was found. `DUPLICATE` is therefore zero in the mutually exclusive summary.

## 4. Per-candidate evidence

### C01 — `ContentEngineDashboard`

- **Current responsibility:** an older generation dashboard with platform selection, generated-post preview, copy/save interaction, content validation/advisor output, and calendar presentation.
- **Discovered consumers:** none. The only source occurrence is its declaration.
- **Runtime reachability:** no App Router page, static import, dynamic import, lazy registration, navigation entry, canonical route entry, package export, or feature flag resolves to the component. Props such as `initialPlatform` and `autoGenerate` are not supplied anywhere.
- **Tests/documentation:** no test, E2E, story, or fixture. Documentation explicitly calls it inactive: the OS 3.8 Blueprint says it is evidence to reuse selectively and must not be restored wholesale; the E1 contract also forbids restoring it.
- **Overlap/replacement authority:** C08 mounts C09 and C10. C09 owns the active generation/editor loop, including the useful interaction details extracted during E1.
- **Risk if removed:** a still-undiscovered external import or interaction detail not captured by E1 could be lost.
- **Required follow-up:** inspect the U1B diff for all exported symbols and compare its copy/save/calendar behavior with C09 one final time.
- **Proposed U1B action:** removal proposal together with C04, subject to approval.

### C02 — `ContentDashboard`

- **Current responsibility:** a second Content Command Center-style dashboard with mission, strategy/scoring cards, quick actions, and an in-memory publishing queue.
- **Discovered consumers:** none. Its imported `useContentEngine` and `usePublishingCenter` trees are only reached by this component.
- **Runtime reachability:** no page, route, import, dynamic loader, navigation registration, barrel/package export, or feature flag mounts it. Its quick actions emit `/content-engine?generate=smart&platform=...`, but the active page does not read those query parameters.
- **Tests/documentation:** no test, E2E, story, or fixture; only the Product Usability Audit names it as one of multiple Content dashboards.
- **Overlap/replacement authority:** C09 owns the active generation/editor experience; current missions and route authority are elsewhere.
- **Risk if removed:** latent strategy/scoring/publishing concepts may be mistaken for approved product behavior.
- **Required follow-up:** Architecture should decide whether any strategy or publishing concept is a future requirement before C02/C05 is removed.
- **Proposed U1B action:** remove C02 and candidate-only C05 after approval; keep C07.

### C03 — `ContentHistory`

- **Current responsibility:** an older list/detail/edit/delete/publish UI over `/api/v1/ai/content`.
- **Discovered consumers:** none. `src/modules/ai/index.ts` does not export it; no page or component imports it.
- **Runtime reachability:** no route mount, navigation entry, dynamic import, lazy registration, package export, or feature flag.
- **Tests/documentation:** no direct test, E2E, story, or fixture. It appears in the W1 cumulative diff and E2 implementation report because E2 updated the file, not because a runtime mount exists.
- **Overlap/replacement authority:** C10 is mounted on the canonical Content route and owns tenant/owner-safe library list, exact-item edit, delete, retry, telemetry, and accessibility behavior.
- **Risk if removed:** governance evidence may be confused with runtime authority; some older UI strings/filters may be intentionally retained for later work.
- **Required follow-up:** confirm with Architecture that the E2 report is evidence only and that no separately planned AI route will mount this component.
- **Proposed U1B action:** removal proposal after that confirmation.

### C04 — dashboard-only advisor and validator

- **Current responsibility:** `contentAdvisor.ts` derives generic tips and `contentValidator.ts` validates generated content for the inactive C01 UI.
- **Discovered consumers:** only C01.
- **Runtime reachability:** transitive only through the unreachable C01 component; no independent API, test, export, or dynamic consumer.
- **Tests/documentation:** no focused test or direct architectural authority found.
- **Overlap/replacement authority:** active C09 uses its own generation/editor contracts and does not import either helper.
- **Risk if removed:** future work might have intended to reuse the helper logic.
- **Required follow-up:** compare behavior with active generation validation and explicitly approve removal as part of C01.
- **Proposed U1B action:** remove only atomically with C01 after approval.

### C05 — dashboard-only strategy hook/service chain

- **Current responsibility:** `useContentEngine.ts` composes locally generated strategy, pillars, and scores for C02; its strategy and pillar services supply that UI.
- **Discovered consumers:** C02 is the only consumer of the hook; the strategy/pillar services are reached only through that chain.
- **Runtime reachability:** transitive only through unreachable C02. No page, API, dynamic loader, barrel/package export, or test reaches the chain.
- **Tests/documentation:** no focused tests or direct architecture authority.
- **Overlap/replacement authority:** active generation uses `contentEngineService` and `contentGenerators.ts`, not this local strategy chain.
- **Risk if removed:** deleting by directory sweep could accidentally include C07, which has a live consumer.
- **Required follow-up:** U1B must use exact file allowlists and prove C07 remains unchanged.
- **Proposed U1B action:** remove the three listed files only with C02 after approval.

### C06 — Content Publishing cluster

- **Current responsibility:** an in-memory module-level publishing queue, statistics, and scheduling recommendations surfaced by C02.
- **Discovered consumers:** `usePublishingCenter` is imported only by C02; the service/types are imported by that hook/service chain.
- **Runtime reachability:** currently only through unreachable C02. However, the module represents a distinct future publishing capability rather than a pure duplicate of E1/E2.
- **Tests/documentation:** no focused tests, E2E, stories, or fixtures; git history predates OS 3.8.
- **Overlap/replacement authority:** C09/C10 cover content creation and library operations, not external publishing orchestration.
- **Risk if removed:** prematurely deciding that publishing is out of the product architecture.
- **Required follow-up:** explicit Architecture decision on whether a future publishing surface/service is planned and whether in-memory semantics have any authority.
- **Proposed U1B action:** exclude from initial removal; retain as `UNCERTAIN` until decided.

### C07 — shared content scoring service

- **Current responsibility:** scores content dimensions.
- **Discovered consumers:** actively imported by `src/modules/content-performance/services/performance-service.ts`, in addition to candidate C05.
- **Runtime reachability:** it has a non-candidate module consumer, so candidate transitive reachability is not the whole consumer graph.
- **Tests/documentation:** its live import is sufficient to reject orphan classification.
- **Risk if removed:** breaks the content-performance service.
- **Required follow-up:** none for U1B beyond explicitly excluding the file.
- **Proposed U1B action:** keep.

### C08–C10 — canonical Content route and active W1 surfaces

- **Current responsibility:** C08 mounts C09 and C10 at `/content-engine`; C09 owns the E1 generation/editor working loop and C10 owns the E2 Content Library.
- **Discovered consumers:** direct page imports, canonical route/navigation/workspace references, API consumers, focused Vitest coverage for C10, and Content E2E coverage.
- **Runtime reachability:** `/content-engine` is registered in `CANONICAL_ROUTES`, both workspace types, sidebar and journey/mission links, onboarding redirects, and E2E navigation.
- **Tests/documentation:** W1 implementation contracts, reports, cumulative review request/result, and Content E2E tests establish active authority.
- **Overlap/replacement authority:** these are the replacements, not removal candidates.
- **Risk if removed:** removes the canonical Content working loop.
- **Required follow-up:** none in U1B.
- **Proposed U1B action:** keep unchanged.

### C11 — Admin Content Center

- **Current responsibility:** operator/platform-admin tenant metrics, publishing activity, and platform usage.
- **Discovered consumers:** `/admin/content` imports the `AdminContentCenter` barrel export; admin overview/navigation links to the route.
- **Runtime reachability:** mounted App Router page with auth/role checks and `workspaceHealthService` data.
- **Tests/documentation:** no focused component test was found, but runtime mounts are explicit.
- **Overlap/replacement authority:** operational admin metrics are distinct from the user Content creation/library loop.
- **Risk if removed:** eliminates an active admin function.
- **Required follow-up:** none for U1B.
- **Proposed U1B action:** keep unchanged.

### C12 — legacy/onboarding redirect pages

- **Current responsibility:** preserve older AI/brand/onboarding entry paths by redirecting to the canonical Content route.
- **Discovered consumers:** App Router convention itself makes each `page.tsx` addressable; onboarding and historical links may be external to static source references.
- **Runtime reachability:** directly route-addressable even when no internal link is found.
- **Tests/documentation:** no candidate-specific test was found; route semantics are explicit in source.
- **Overlap/replacement authority:** they funnel users to C08 rather than rendering a duplicate dashboard.
- **Risk if removed:** breaks bookmarks, onboarding completion paths, or historical deep links.
- **Required follow-up:** any retirement needs an IA/deep-link compatibility decision and traffic evidence unavailable from repository-only inventory.
- **Proposed U1B action:** keep.

## 5. Runtime-consumer findings

1. The only current `/content-engine` page composition is C08, which statically mounts C09 and C10.
2. `CANONICAL_ROUTES.contentEngine`, workspace configuration for both retail and recruitment, navigation/mission links, and multiple redirect pages converge on `/content-engine`.
3. Neither `next.config.mjs` nor App Router pages redirect to or mount C01, C02, or C03.
4. No candidate is recovered through a dynamic import, lazy loader, barrel export, package export, feature flag, story, fixture, or test.
5. `/admin/content` is independently mounted and role-gated. Similar naming does not make it duplicate product UI.
6. API existence is not component reachability: C01 and C03 call active Content APIs, but no route renders those components.
7. Transitive analysis prevents over-deletion: C07 is shared outside the candidate chain, while C04/C05 are candidate-only at this baseline.

## 6. Duplicate-capability findings

- C01 duplicates generation, preview, copy/save, and calendar concepts now represented by the active Command Center. The Blueprint explicitly makes it historical evidence, not route authority.
- C02 duplicates Command Center framing, mission, generation entry, strategy/scoring presentation, and a publishing summary. Its query-string quick actions have no reader in the active page.
- C03 duplicates the active Content Library's list/detail/edit/delete/publish-adjacent operations, but lacks the current mounted session/race/accessibility guarantees.
- C06 is not treated as duplicate because publishing orchestration is a distinct capability. Its lack of reachability is evidence of inactivity, not authority to delete the capability.

## 7. Uncertain findings

The repository alone cannot decide whether C06 is intentionally parked future publishing architecture or abandoned prototype code. Runtime traffic, product roadmap intent, and Architecture ownership are outside this repository-only task. C06 therefore remains `UNCERTAIN` and is excluded from the proposed first U1B deletion set.

Redirect pages in C12 are classified `KEEP` with medium confidence because route conventions make them reachable and external deep-link traffic cannot be disproved by repository search.

## 8. Proposed U1B removal candidates

If Architecture and Steven approve deletion after exact-head review, the narrow initial U1B proposal is:

1. C01 + C04 as one dependency-closed set.
2. C02 + C05 as one exact-file set, explicitly excluding C07 and C06.
3. C03 as a separate removal after confirming its E2 documentation reference is evidence rather than future route intent.

U1B should run static search again at its own authorized baseline, delete by exact allowlist rather than directory, run full product gates, and verify `/content-engine`, `/admin/content`, API contracts, E1/E2 tests, and redirects remain intact.

## 9. Explicit no-deletion boundary

This document is an inventory, not a deletion plan or approval record. No file is `approved_for_deletion`; no deletion, move, rename, code change, navigation change, redirect, Manifest update, U2 action, or AR-W2 artifact is authorized or performed here.

## 10. Inputs U2 may use without making an IA decision early

U2 may safely rely on these evidence-only facts:

- `/content-engine` is the canonical user Content route.
- Its active composition is C09 followed by C10.
- `/admin/content` is a separate operator surface.
- Legacy/onboarding route pages converge on `/content-engine` and should not be treated as duplicate dashboards.
- The repository contains inactive Content UI and uncertain publishing code, but U2 must not hide, remove, or reinterpret either set as part of navigation work.
- Any future navigation proposal should use `CANONICAL_ROUTES` and shared workspace configuration, without treating this inventory as an IA decision.
