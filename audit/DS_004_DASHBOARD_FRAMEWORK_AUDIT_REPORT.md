# DS-004 Dashboard Framework Audit Report

**Audit Type:** Independent Code + Architecture Audit  
**Auditor:** Claude Code (Independent Architecture Auditor)  
**Date:** 2026-06-29  
**Project:** NextShift OS 3.1 / NextShift Design System v1.0  
**Slice:** DS-004 Dashboard Framework

---

## Audit Result

**PASS WITH MINOR NOTES**

---

## Executive Summary

DS-004 Dashboard Framework is a clean, correctly scoped extension to `@nextshift/ui`. All twelve required dashboard primitives are present, exported, and typed. The implementation composes DS-002 components (`EmptyState`, `Spinner`) and DS-003 layout primitives (`AppShell`, `MainContent`, `PageHeader`) appropriately, without duplicating existing primitives. Dashboard style contracts are entirely token-driven from DS-001. All 33 unit tests pass with zero typecheck errors across all packages. One MEDIUM finding was identified: `DashboardShell` applies density `padding` and `gap` at the AppShell grid root level, which creates spacing between/around all grid slots (header, sidebar, main, footer), an atypical shell-level layout behavior. Three LOW findings and four NOTEs cover nested ARIA roles, missing toolbar semantics, the hardcoded widget heading level, and minor type duplication. No blockers or high-severity issues.

---

## Files Inspected

```
packages/ui/src/dashboard/dashboard-shell.tsx
packages/ui/src/dashboard/dashboard-page.tsx
packages/ui/src/dashboard/dashboard-grid.tsx
packages/ui/src/dashboard/dashboard-panel.tsx
packages/ui/src/dashboard/widget-container.tsx
packages/ui/src/dashboard/widget-header.tsx
packages/ui/src/dashboard/widget-body.tsx
packages/ui/src/dashboard/widget-footer.tsx
packages/ui/src/dashboard/dashboard-toolbar.tsx
packages/ui/src/dashboard/dashboard-filter-bar.tsx
packages/ui/src/dashboard/dashboard-empty-state.tsx
packages/ui/src/dashboard/dashboard-loading-state.tsx
packages/ui/src/dashboard/index.ts
packages/ui/src/styles/dashboard-styles.ts
packages/ui/src/types/dashboard-types.ts
packages/ui/src/index.ts
packages/ui/src/styles/index.ts
packages/ui/src/types/index.ts
packages/ui/test/dashboard-framework.test.tsx
packages/ui/test/layout-system.test.tsx
packages/ui/test/component-library.test.tsx
docs/nextshift-os-3/design-system/slices/DS-004-dashboard-framework/README.md
docs/nextshift-os-3/design-system/slices/DS-004-dashboard-framework/IMPLEMENTATION_REPORT.md
```

---

## Commands Executed

| Command | Result |
|---|---|
| `pnpm --filter @nextshift/ui typecheck` | ✅ PASS — 0 errors |
| `pnpm --filter @nextshift/ui test` | ✅ PASS — 3 files / 33 tests |
| `pnpm --filter @nextshift/shared typecheck` | ✅ PASS — 0 errors |
| `pnpm --filter @nextshift/shared test` | ✅ PASS — 1 file / 9 tests |
| `pnpm --filter @nextshift/domain typecheck` | ✅ PASS — 0 errors |
| `pnpm --filter @nextshift/domain test` | ✅ PASS — 31 files / 285 tests |
| `pnpm --filter @nextshift/application typecheck` | ✅ PASS — 0 errors |
| `pnpm --filter @nextshift/application test` | ✅ PASS — 34 files / 211 tests |

---

## Scope Boundary Findings

DS-004 stayed within scope. No violations found.

Confirmed absent: runtime redesign, governance changes, database changes, backend APIs, business capability modifications, CRM/Revenue/Analytics/Decision Intelligence/Business Brain dashboards or screens, business widgets, charts, routing, route-aware navigation, data fetching, state persistence, authentication/authorization changes, theme switcher UI, unrelated refactors. No new packages or dependencies were introduced. Modified existing files are limited to barrel extensions and planning docs.

---

## Package Extension Findings

DS-004 correctly extends `@nextshift/ui` without creating a second package or adding dependencies:

- New `packages/ui/src/dashboard/` directory — 12 component files + barrel ✅
- New `packages/ui/src/styles/dashboard-styles.ts` ✅
- New `packages/ui/src/types/dashboard-types.ts` ✅
- `packages/ui/src/index.ts` updated with `export * from "./dashboard"` — additive only ✅
- `packages/ui/src/styles/index.ts` updated with 13 dashboard style function exports — additive only ✅
- `packages/ui/src/types/index.ts` updated with 4 dashboard type exports — additive only ✅
- `packages/ui/package.json`, `tsconfig.json`, `vitest.config.ts` unchanged ✅

All DS-002 and DS-003 exports remain intact. The extension pattern is identical to DS-003.

---

## Dashboard Primitive Coverage Findings

All twelve required primitives are implemented and exported:

| Primitive | File | Root Element | DS-002/DS-003 Composition |
|---|---|---|---|
| DashboardShell | `dashboard-shell.tsx` | via `AppShell` | Extends `AppShell` (DS-003) |
| DashboardPage | `dashboard-page.tsx` | via `MainContent` + `<div>` | Composes `MainContent`, `PageHeader` (DS-003) |
| DashboardGrid | `dashboard-grid.tsx` | `<div>` | Independent (grid layout) |
| DashboardPanel | `dashboard-panel.tsx` | `<section>` | Token-driven, mirrors DS-002 Card |
| WidgetContainer | `widget-container.tsx` | `<section>` | Token-driven |
| WidgetHeader | `widget-header.tsx` | `<div>` | Contains `<h3>` title |
| WidgetBody | `widget-body.tsx` | `<div>` | Minimal content slot |
| WidgetFooter | `widget-footer.tsx` | `<div>` | Minimal footer slot |
| DashboardToolbar | `dashboard-toolbar.tsx` | `<div>` | Structural leading/trailing slots |
| DashboardFilterBar | `dashboard-filter-bar.tsx` | `<div>` | Structural filters/actions slots |
| DashboardEmptyState | `dashboard-empty-state.tsx` | via `EmptyState` | Composes DS-002 `EmptyState` |
| DashboardLoadingState | `dashboard-loading-state.tsx` | `<div>` + `Spinner` | Composes DS-002 `Spinner` |

No primitive is business-specific. All are minimal, reusable structural foundations.

---

## Token Consumption Findings

`dashboard-styles.ts` imports `componentTokens` and `nextShiftThemeTokens` from `@nextshift/shared`, and `resolveLayoutGap` from DS-003's `layout-styles.ts`:

| Token Category | Used | Examples |
|---|---|---|
| Component tokens (card.*) | ✅ | `componentTokens.card.background/border/radius/shadow/foreground` |
| Semantic colors | ✅ | `color.background/foreground/surface/surfaceMuted/border/mutedForeground/success/warning/danger/info` |
| Spacing | ✅ | `spacing["3"]`, `spacing["4"]`, `spacing["6"]`, `spacing["8"]` |
| Typography | ✅ | `fontFamily.sans`, `fontSize.base/sm`, `fontWeight.semibold`, `lineHeight.normal` |
| Elevation | ✅ | `elevation.none` |
| Radius | ✅ | `radius.lg` |
| DS-003 gap resolver | ✅ | `resolveLayoutGap(densityGap[density])` — reuses layout gap system |

No arbitrary hardcoded design values where tokens exist. `minHeight: "14rem"` in `getDashboardStateStyle()` and `minHeight: "100%"` in `getDashboardShellStyle()` are structural layout values with no token equivalent. `1px` borders use template literals with token color values.

Token usage confirmed by test: `getDashboardShellStyle("comfortable").background === theme.color.background`, `getDashboardGridStyle(...).gap === theme.spacing["4"]`, `getDashboardPanelStyle("elevated", ...).boxShadow === componentTokens.card.shadow`, `getWidgetContainerStyle("info").border` contains `theme.color.info`.

---

## DS-002 / DS-003 Composition Findings

DS-004 composes prior-slice primitives correctly and does not duplicate existing functionality:

**DS-003 composition:**
- `DashboardShell` wraps `AppShell` and passes all AppShell props through via `Omit<AppShellProps, "children" | "style">` ✅
- `DashboardPage` composes `MainContent` (provides `<main>` landmark) and `PageHeader` (provides heading structure) ✅
- `resolveLayoutGap` from DS-003's style module is reused directly — no gap logic duplication ✅

**DS-002 composition:**
- `DashboardEmptyState` delegates directly to `EmptyState` — no reimplementation ✅
- `DashboardLoadingState` composes `Spinner` — no reimplementation ✅
- `componentTokens.card.*` values reused in `getDashboardPanelStyle` and `getWidgetContainerStyle` — consistent card-family visual language ✅

**No export conflicts**: DS-002, DS-003, and DS-004 symbol names are distinct (`Dashboard*`, `Widget*` vs `*Shell`/`*Header` vs `Button`/`Card`). TypeScript typecheck confirms no conflicts ✅

**Backward compatibility test**: test file explicitly verifies `Button`, `AppShell`, and `PageHeader` are still importable from `@nextshift/ui` and renderable ✅

**Existing tests**: all 10 DS-002 and 14 DS-003 tests pass unchanged ✅

---

## Public API Findings

`packages/ui/src/index.ts` exports all dashboard content via `export * from "./dashboard"`. The public surface adds:

- **Components**: all 12 dashboard primitives ✅
- **Prop types**: all 12 `*Props` interfaces ✅
- **Dashboard types**: `DashboardDensity`, `DashboardGridColumns`, `DashboardPanelVariant`, `WidgetStatus` ✅
- **Style functions**: `getDashboardShellStyle`, `getDashboardPageStyle`, `getDashboardGridStyle`, `getDashboardPanelStyle`, `getWidgetContainerStyle`, `getWidgetHeaderStyle`, `getWidgetBodyStyle`, `getWidgetFooterStyle`, `getToolbarStyle`, `getDashboardFilterBarStyle`, `getDashboardStateStyle`, `getWidgetTitleStyle`, `getWidgetDescriptionStyle` ✅

Consumer import `import { DashboardPage, DashboardGrid, WidgetContainer, type WidgetStatus } from "@nextshift/ui"` works as expected. Style functions are public API consistent with DS-002/DS-003 pattern.

---

## Prop Typing Findings

**`DashboardDensity` = `"compact" | "comfortable" | "spacious"`** — consistent with DS-003's `LayoutDensity` ✅

**`DashboardGridColumns` = `1 | 2 | 3 | 4 | 6 | 12 | "auto"`** — identical to DS-003's `GridColumns`. Type duplication is a NOTE-level concern — see Issues N-003.

**`DashboardPanelVariant` = `"plain" | "bordered" | "elevated"`** — mirrors DS-002 Card variant pattern ✅

**`WidgetStatus` = `"default" | "success" | "warning" | "danger" | "info"`** — clean semantic union ✅

**`DashboardShellProps`**: `Omit<AppShellProps, "children" | "style">` re-declares `style` separately. This is functionally equivalent since `HTMLAttributes<HTMLDivElement>` includes `style`, but the Omit+re-declare pattern documents the intent that DashboardShell merges its own style with the consumer's.

**`DashboardPage`**: extends `Omit<React.HTMLAttributes<HTMLDivElement>, "title">` — correctly avoids collision with `HTMLElement.title` ✅. `headingLevel` is NOT forwarded from `DashboardPage` to `PageHeader`, meaning PageHeader always defaults to `headingLevel=1`. This is correct for a page-level component ✅.

**All primitives** support `className`, `style`, and spread native element props ✅.

No ref forwarding on dashboard components — consistent with DS-002/DS-003 pattern (deferred to DS-005/DS-007).

---

## Accessibility Findings

**`DashboardPage`**: Composes `MainContent` (`<main>`) and `PageHeader` (configurable heading) — correct semantic page structure ✅.

**`DashboardLoadingState`**: `role="status"` on outer `<div>`, `aria-label={label}` ✅. However, the inner `Spinner` also renders `role="status"` with `aria-label`. This produces **nested live regions**:
```html
<div role="status" aria-label="Loading dashboard">    <!-- outer live region -->
  <span role="status" aria-label="Loading dashboard"> <!-- Spinner: inner live region -->
    <span>Loading dashboard</span>
  </span>
  <span>Loading dashboard</span>  <!-- visible text: label duplicated third time -->
</div>
```
Nested `role="status"` elements can cause duplicate announcements in screen readers. The Spinner inside `DashboardLoadingState` should receive `aria-hidden="true"` (as it does when inside `Button`) since the outer container already provides the live region. See Issues L-001.

**`DashboardEmptyState`**: Delegates to DS-002 `EmptyState` with `role="status"` ✅.

**`DashboardPanel` and `WidgetContainer`**: Both render `<section>` without `aria-label`. Unnamed `<section>` elements are demoted from landmarks to generic regions by screen readers — consistent with DS-002 Card and DS-003 Section behavior. Avoids landmark pollution ✅.

**`WidgetHeader`**: Renders `title` as hardcoded `<h3>` — see Issues L-003. In the typical heading hierarchy (h1 page → h2 section → h3 widget), `<h3>` is appropriate. More defensible than DS-003 Section's fixed `<h2>`.

**`DashboardToolbar` and `DashboardFilterBar`**: Plain `<div>` elements with no `role`. ARIA pattern recommends `role="toolbar"` for groups of interactive controls. Without it, keyboard users won't get expected arrow-key navigation within the toolbar area — see Issues L-002.

**Focus management**: No `outline: 0` or focus-ring removal anywhere in `dashboard-styles.ts` ✅.

**DOM order**: `DashboardPage` renders PageHeader before content ✅. `DashboardPanel` renders children in document order ✅. WidgetContainer → WidgetHeader → WidgetBody → WidgetFooter is the expected composition order ✅.

---

## Styling Strategy Findings

All dashboard visual properties are derived from DS-001 `componentTokens` and `nextShiftThemeTokens`. No external UI framework introduced. No Tailwind, Radix, shadcn, or similar ✅.

**`resolveLayoutGap` reuse**: Dashboard gap values go through DS-003's gap resolver (`resolveLayoutGap(densityGap[density])`), ensuring consistent gap semantics across layout and dashboard layers ✅.

**`getDashboardFilterBarStyle` inherits from `getToolbarStyle`**: `getDashboardFilterBarStyle` calls `mergeStyles(getToolbarStyle(), { background: theme.color.surfaceMuted })`. The filter bar is visually distinguished by `surfaceMuted` background. This is a clean reuse of the toolbar visual contract ✅.

**`getDashboardShellStyle` padding concern**: `DashboardShell` applies `getDashboardShellStyle(density)` as the style prop to `AppShell`. Because AppShell applies `mergeStyles(getAppShellStyle(...), incomingStyle)`, the merge order is AppShell base first, DashboardShell override second. The DashboardShell style adds `gap` and `padding` to the AppShell grid root. This means density-driven `gap` is applied **between** grid areas (header/sidebar/main/footer) and `padding` is applied **around all of them** at the shell boundary. In a typical full-page dashboard with a sticky header, this produces unexpected visual spacing: the header bar floats away from the viewport edge, the sidebar has a gap from the header — see Issues M-001.

**DS-008 theme override readiness**: All colors and typography come from `nextShiftThemeTokens`. Static theme replacement flows through automatically ✅.

---

## Test Coverage Findings

9 tests in `dashboard-framework.test.tsx`, all passing:

| Test | Coverage |
|---|---|
| `exposes public dashboard components and types` | All 12 components + type assignments |
| `renders dashboard shell composed with DS-003 AppShell semantics` | data-nextshift-dashboard, data-nextshift-layout, AppShell composition |
| `renders dashboard page with header and content` | `<main>`, PageHeader slots, data-density |
| `renders dashboard grid` | data-nextshift-dashboard, data-columns |
| `renders dashboard panel composition` | panel + widget + header + body + footer nesting |
| `renders toolbar and filter bar` | data-nextshift-dashboard attrs for both |
| `renders loading and empty states` | aria-label, role="status" (via EmptyState), text content |
| `uses DS-001 tokens in dashboard style contracts` | 5 token value assertions |
| `keeps DS-002 and DS-003 exports available` | Button, AppShell, PageHeader defined and renderable |

Combined with 14 DS-003 and 10 DS-002 tests, total coverage is 33 tests across 3 files.

**Minor coverage gaps (all NOTE-level):**
- `DashboardPanel` variants `plain` and `bordered` not tested (only `elevated`)
- `WidgetContainer` statuses `success`, `warning`, `danger`, `default` not tested (only `info` via token assertion)
- `DashboardGrid` with `columns="auto"` not tested
- `DashboardLoadingState` nested role duplication not tested (no accessible-markup-level test)
- `DashboardPage` without `title` (no PageHeader rendered) not tested
- `DashboardShell` `density="compact"` and `density="spacious"` not tested

These are secondary paths; primary structural coverage is adequate.

---

## Documentation Findings

**DS-004 README** covers: purpose, complete primitive list, token and composition model, non-goals, accessibility baseline, and example usage. Clear and concise.

**IMPLEMENTATION_REPORT** covers: scope, architecture decision, files created/modified, test results, typecheck results, known limitations, and backward compatibility statement. Complete.

**Minor documentation gaps (NOTE-level):**
- README does not warn that `DashboardPage` renders a `<main>` element — consumers must avoid nesting two `DashboardPage` components on the same page
- README does not document `DashboardShell` density padding behavior or the `minHeight: "100%"` vs `"100vh"` override
- README does not document the nested `role="status"` issue in `DashboardLoadingState`
- README does not document that `WidgetHeader.title` is hardcoded to `<h3>`

---

## Backward Compatibility Findings

DS-004 is fully backward-compatible with DS-001, DS-002, DS-003, and CAP-001 through CAP-008.

- All DS-002/DS-003 exports intact: 24 prior tests pass ✅
- DS-001 exports unchanged: 9 shared tests pass ✅
- Domain tests: 31 files / 285 tests pass ✅
- Application tests: 34 files / 211 tests pass ✅
- No runtime, governance, database, or business capability behavior modified ✅

---

## Future Slice Readiness

| Slice | Readiness |
|---|---|
| DS-005 Interaction System | ✅ — all dashboard components accept native event props; motion tokens available for hover/transition layers |
| DS-006 Data Visualization | ✅ — `WidgetContainer`/`WidgetBody` are the natural chart host; `DashboardGrid` handles chart layout |
| DS-007 Accessibility | ⚠️ — three items need DS-007 work: (1) DashboardToolbar/FilterBar need `role="toolbar"` and `aria-label`; (2) DashboardLoadingState needs Spinner `aria-hidden`; (3) WidgetHeader heading level should be configurable |
| DS-008 Theme & Branding | ✅ — all visual values are token-derived; static theme substitution flows automatically |

---

## Issues Found

### BLOCKER

None.

### HIGH

None.

### MEDIUM

**M-001**  
**Location:** `packages/ui/src/dashboard/dashboard-shell.tsx:23` + `packages/ui/src/styles/dashboard-styles.ts:35–47`  
**Finding:** `DashboardShell` applies `getDashboardShellStyle(density)` as the `style` prop passed into `AppShell`. Inside `AppShell`, this is merged as `mergeStyles(getAppShellStyle(...), incomingStyle)`. The DashboardShell style overrides add:
- `gap: resolveLayoutGap(densityGap[density])` — creates CSS grid gap **between** the header, sidebar, main, and footer grid areas
- `padding: densityPadding[density]` — creates padding **around all grid areas** at the shell boundary
- `minHeight: "100%"` — overrides AppShell's `minHeight: "100vh"`

In a full-page dashboard layout, gap between grid areas means the header bar floats away from the viewport top, the sidebar has a gap from the header, and footer has a gap from main — atypical behavior for an application shell. Padding at the shell root creates a uniform gutter around all structural regions. The density abstraction would be better applied inside `DashboardPage`'s content grid (where it already also applies `getDashboardPageStyle`) rather than at the shell root level.  
**Recommendation:** Remove `padding` and `gap` from `getDashboardShellStyle`. These properties belong at the `DashboardPage`/`DashboardGrid` level where density affects content spacing, not at the shell-level grid root. If shell-level breathing room is intended, document it explicitly as a design decision.

### LOW

**L-001**  
**Location:** `packages/ui/src/dashboard/dashboard-loading-state.tsx:14–28`  
**Finding:** `DashboardLoadingState` renders `role="status"` on its outer `<div>`, then renders a `<Spinner>` inside it, which also renders `role="status"`. This produces nested live regions. Screen readers may announce the loading label multiple times. The visible `<span>{label}</span>` is also a third textual repetition. The `Spinner` inside `DashboardLoadingState` should receive `aria-hidden="true"` (the same treatment used in `Button`'s loading state) to prevent the inner `role="status"` from firing while the outer one already announces the state.  
**Recommendation:** Pass `aria-hidden="true"` to `Spinner` inside `DashboardLoadingState`. The outer `<div role="status" aria-label={label}>` is sufficient for screen reader announcement. The visible `<span>{label}</span>` can remain for visual context.

**L-002**  
**Location:** `packages/ui/src/dashboard/dashboard-toolbar.tsx` + `packages/ui/src/dashboard/dashboard-filter-bar.tsx`  
**Finding:** Both `DashboardToolbar` and `DashboardFilterBar` render plain `<div>` containers with no ARIA role. When these primitives contain interactive controls (buttons, selects, inputs), the ARIA specification expects `role="toolbar"` with an `aria-label` to enable proper keyboard navigation (arrow key movement between controls within the toolbar). Without it, screen reader users cannot efficiently navigate the toolbar controls.  
**Recommendation:** Add `role="toolbar"` and support an `aria-label` prop on both components. Since the spec says toolbars are structural slots, an overridable default `aria-label` (e.g., `"Dashboard toolbar"`) would cover the common case while allowing consumers to provide a descriptive label. Fix in DS-004 patch or DS-007.

**L-003**  
**Location:** `packages/ui/src/dashboard/widget-header.tsx:33`  
**Finding:** `WidgetHeader` renders `title` as a hardcoded `<h3>` element with no configurable heading level. While `<h3>` is appropriate in the typical heading hierarchy (h1 page → h2 panel/section → h3 widget), widgets used outside this structure may skip heading levels. This mirrors DS-003 Section's M-001 finding (hardcoded `<h2>`), though `<h3>` is more defensible in the dashboard context.  
**Recommendation:** Add `headingLevel?: 2 | 3 | 4` (default `3`) to `WidgetHeaderProps`. Fix alongside DS-003 Section's `headingLevel` patch to address both heading-level gaps in a single pass.

### NOTE

**N-001**  
**Location:** `packages/ui/src/styles/dashboard-styles.ts:43` — `minHeight: "100%"`  
**Finding:** `getDashboardShellStyle` sets `minHeight: "100%"` which overrides AppShell's `minHeight: "100vh"`. In most usage patterns `DashboardShell` is the top-level shell, so `"100%"` relative to the `<body>` should fill the viewport if `<html>` and `<body>` have `height: 100%`. If the parent doesn't have a defined height, `"100%"` will shrink-wrap. This is a documentation concern rather than a bug — it should be mentioned in usage guidance.  
**Recommendation:** Document the minimum CSS requirement (`html, body { height: 100% }`) when `DashboardShell` is used as the top-level shell. If M-001 is resolved and the `getDashboardShellStyle` is simplified, revisit whether `minHeight: "100%"` or `"100vh"` is more appropriate.

**N-002**  
**Location:** `packages/ui/src/styles/dashboard-styles.ts:153–157` — `getDashboardFilterBarStyle`  
**Finding:** `getDashboardFilterBarStyle` calls `mergeStyles(getToolbarStyle(), { background: theme.color.surfaceMuted })`. The filter bar is semantically and structurally coupled to the toolbar style. If `getToolbarStyle` changes (e.g., layout restructure), `getDashboardFilterBarStyle` inherits those changes. This implicit coupling is undocumented.  
**Recommendation:** Add a comment documenting the intentional inheritance. If toolbar and filter bar styles diverge in DS-005+, split them into independent functions.

**N-003**  
**Location:** `packages/ui/src/types/dashboard-types.ts:2` — `DashboardGridColumns`  
**Finding:** `DashboardGridColumns = 1 | 2 | 3 | 4 | 6 | 12 | "auto"` is identical to DS-003's `GridColumns`. This type duplication means future changes to the column set must be applied in two places.  
**Recommendation:** Re-export `GridColumns` from DS-003's layout types as `DashboardGridColumns`, or simply use `GridColumns` directly in `DashboardGridProps`. Eliminates duplication without changing the public API shape.

**N-004**  
**Location:** `packages/ui/src/dashboard/dashboard-page.tsx:30`  
**Finding:** `DashboardPage` wraps children in `<MainContent>` which renders `<main>`. Multiple `DashboardPage` components on the same React tree would produce multiple `<main>` elements, violating the "one `<main>` per page" HTML specification. This is a consumer-side constraint but is not documented in the README.  
**Recommendation:** Add a usage note to the README: "Use one `DashboardPage` per page. Nesting two `DashboardPage` components produces multiple `<main>` elements."

---

## Required Fixes Before Release

None. M-001 (density padding/gap at shell level) is a design behavior concern worth addressing, but it does not break any consumer API, produce runtime errors, or block the infrastructure layer from functioning. Recommend addressing M-001 in a DS-004 patch before dashboard business pages are built in DS-006+.

---

## Recommended Follow-ups

1. **(DS-004 patch)** Move `gap` and `padding` from `getDashboardShellStyle` out of the AppShell grid root — resolves M-001. Keep density at the `DashboardPage`/`DashboardGrid` level where it affects content layout.
2. **(DS-004 patch)** Add `aria-hidden="true"` to the `Spinner` inside `DashboardLoadingState` — resolves L-001.
3. **(DS-004 patch / DS-007)** Add `role="toolbar"` and `aria-label` support to `DashboardToolbar` and `DashboardFilterBar` — resolves L-002.
4. **(DS-004 patch / DS-007)** Add `headingLevel?: 2 | 3 | 4` to `WidgetHeaderProps` (default `3`) — resolves L-003. Batch with DS-003 Section's heading level fix.
5. **(DS-003 patch dependency)** Resolve DS-003 M-001 (Section heading level) in parallel with L-003 above.
6. **(DS-004 docs)** Document: one `DashboardPage` per page; `DashboardShell` requires parent height; `WidgetHeader.title` renders `<h3>`.
7. **(DS-003 types)** Unify `DashboardGridColumns` with DS-003's `GridColumns` to eliminate type duplication — resolves N-003.
8. **(Any DS slice)** Add tests for `DashboardPanel` variants, `WidgetContainer` statuses, `DashboardGrid` auto-fit, and `DashboardPage` without title.

---

## Final Recommendation

**DS-004 Dashboard Framework is production-ready. Proceed to Verification and Release.**

The implementation is correctly scoped, token-driven, well-composed from DS-001/002/003 primitives, and backward-compatible. The MEDIUM finding (density padding/gap at shell level) is a design behavior concern for future patches before business dashboards are built — it does not break the infrastructure layer. The LOWs and NOTEs are forward-looking items appropriate for DS-004 patch or DS-007.
