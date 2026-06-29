# DS-003 Layout System Audit Report

**Audit Type:** Independent Code + Architecture Audit  
**Auditor:** Claude Code (Independent Architecture Auditor)  
**Date:** 2026-06-29  
**Project:** NextShift OS 3.1 / NextShift Design System v1.0  
**Slice:** DS-003 Layout System

---

## Audit Result

**PASS WITH MINOR NOTES**

---

## Executive Summary

DS-003 Layout System is a clean, well-scoped extension to `@nextshift/ui`. All twelve required layout primitives are present, exported, and typed. DS-002 component exports are fully preserved and verified by a dedicated backward-compatibility test. Layout style contracts are entirely token-driven from DS-001 — spacing, breakpoints, color, typography, and z-index tokens are all consumed. Semantic HTML is used correctly for `<main>`, `<header>`, `<aside>` (with `aria-label`), and heading elements. The responsive strategy is lightweight (one exported CSS string, no runtime breakpoint detection) and uses the DS-001 breakpoint token. All 24 unit tests pass with zero typecheck errors across all packages. One MEDIUM finding (Section heading level not configurable), two LOWs, and four NOTEs were identified — all manageable and appropriate for follow-up in DS-004 through DS-007.

---

## Files Inspected

```
packages/ui/src/layout/app-shell.tsx
packages/ui/src/layout/page-shell.tsx
packages/ui/src/layout/header.tsx
packages/ui/src/layout/sidebar.tsx
packages/ui/src/layout/main-content.tsx
packages/ui/src/layout/container.tsx
packages/ui/src/layout/stack.tsx
packages/ui/src/layout/inline.tsx
packages/ui/src/layout/grid.tsx
packages/ui/src/layout/split-panel.tsx
packages/ui/src/layout/section.tsx
packages/ui/src/layout/page-header.tsx
packages/ui/src/layout/index.ts
packages/ui/src/styles/layout-styles.ts
packages/ui/src/styles/index.ts
packages/ui/src/types/layout-types.ts
packages/ui/src/types/index.ts
packages/ui/src/index.ts
packages/ui/test/layout-system.test.tsx
packages/ui/test/component-library.test.tsx
packages/ui/package.json
packages/ui/tsconfig.json
packages/ui/vitest.config.ts
docs/nextshift-os-3/design-system/slices/DS-003-layout-system/README.md
docs/nextshift-os-3/design-system/slices/DS-003-layout-system/IMPLEMENTATION_REPORT.md
```

---

## Commands Executed

| Command | Result |
|---|---|
| `pnpm --filter @nextshift/ui typecheck` | ✅ PASS — 0 errors |
| `pnpm --filter @nextshift/ui test` | ✅ PASS — 2 files / 24 tests |
| `pnpm --filter @nextshift/shared typecheck` | ✅ PASS — 0 errors |
| `pnpm --filter @nextshift/shared test` | ✅ PASS — 1 file / 9 tests |
| `pnpm --filter @nextshift/domain typecheck` | ✅ PASS — 0 errors |
| `pnpm --filter @nextshift/domain test` | ✅ PASS — 31 files / 285 tests |
| `pnpm --filter @nextshift/application typecheck` | ✅ PASS — 0 errors |
| `pnpm --filter @nextshift/application test` | ✅ PASS — 34 files / 211 tests |

---

## Scope Boundary Findings

DS-003 stayed within scope. No violations found.

Confirmed absent: runtime redesign, governance changes, database changes, backend APIs, business capability modifications, CRM/Campaign/Revenue/Analytics/Decision Intelligence/Business Brain screens, Dashboard Framework, route-aware sidebar, routing, data fetching, authentication/authorization changes, chart components, theme switcher UI, unrelated refactors. No new packages were created. No new dependencies were added to `@nextshift/ui`. Modified files outside new additions: `packages/ui/src/index.ts`, `packages/ui/src/styles/index.ts`, `packages/ui/src/types/index.ts` (all additive barrel extensions), and design system planning docs (no code impact).

---

## Package Extension Findings

DS-003 correctly extends `@nextshift/ui` without creating a second package or adding dependencies:

- New `packages/ui/src/layout/` directory — 12 component files + barrel ✅
- New `packages/ui/src/styles/layout-styles.ts` — layout style contract ✅
- New `packages/ui/src/types/layout-types.ts` — layout types ✅
- `packages/ui/src/index.ts` updated to add `export * from "./layout"` — additive only ✅
- `packages/ui/src/styles/index.ts` updated to re-export all layout style functions — additive only ✅
- `packages/ui/src/types/index.ts` updated to re-export all layout types — additive only ✅
- `packages/ui/package.json`: unchanged — no new dependencies ✅
- `packages/ui/tsconfig.json`: unchanged ✅
- `packages/ui/vitest.config.ts`: unchanged — new test file picked up automatically by `test/**/*.test.tsx` glob ✅

All DS-002 component exports, prop types, and style functions remain present and unchanged.

---

## Layout Primitive Coverage Findings

All twelve required primitives are implemented and exported:

| Primitive | File | Root Element | Notes |
|---|---|---|---|
| AppShell | `app-shell.tsx` | `<div>` | Grid-based full-page shell |
| PageShell | `page-shell.tsx` | `<div>` | Page content area wrapper with density |
| Header | `header.tsx` | `<header>` | 3-slot grid (leading/center/trailing) |
| Sidebar | `sidebar.tsx` | `<aside>` | Collapsible, `aria-label` required |
| MainContent | `main-content.tsx` | `<main>` | Semantic page main region |
| Container | `container.tsx` | `<div>` | Max-width + padding wrapper |
| Stack | `stack.tsx` | `<div>` | Vertical flex |
| Inline | `inline.tsx` | `<div>` | Horizontal flex with wrap |
| Grid | `grid.tsx` | `<div>` | CSS Grid with columns or auto-fit |
| SplitPanel | `split-panel.tsx` | `<div>` | 2-column grid with ratio and responsive collapse |
| Section | `section.tsx` | `<section>` | Content section with optional Card wrapper |
| PageHeader | `page-header.tsx` | `<div>` | Heading + description + actions block |

No primitive is business-specific. All implementations are minimal and reusable.

---

## Token Consumption Findings

`layout-styles.ts` imports `nextShiftThemeTokens` from `@nextshift/shared` and uses it throughout:

| Token Category | Used | Examples |
|---|---|---|
| Spacing | ✅ Extensive | `spacing["0"]` through `spacing["32"]` across all gap/padding/width maps |
| Breakpoints | ✅ | `breakpoint.sm/md/lg/xl` for container sizes and responsive CSS string |
| Semantic colors | ✅ | `color.background`, `color.foreground`, `color.surface`, `color.border`, `color.mutedForeground` |
| Typography | ✅ | `typography.fontFamily.sans`, `typography.scale.heading.h2.*`, `typography.fontSize.sm`, `typography.lineHeight.normal` |
| Z-index | ✅ | `zIndex.sticky`, `zIndex.base` for Header and Sidebar sticky behavior |
| Radius | — | Not used in layout-styles.ts — layout components do not have rounded corners by design |
| Elevation | — | Not used directly — layout uses borders (`1px solid theme.color.border`), not box-shadows |

No arbitrary hardcoded design values where tokens exist. Non-token values are all correct: CSS layout keywords (`"flex-start"`, `"space-between"`, `"nowrap"`, `"auto-fit"`), structural values (`"100%"`, `"100vh"`, `"minmax(0, 1fr)"`), and reset values (`margin: 0`). Derived spacing `calc(${theme.spacing["32"]} * 2)` for expanded sidebar width uses token as base — correct.

Token consumption confirmed by test: `resolveLayoutGap("md") === theme.spacing["4"]`, `getHeaderStyle().borderBottom` contains `theme.color.border`, `getContainerStyle("lg").maxWidth === theme.breakpoint.lg`, `layoutResponsiveCss` contains `theme.breakpoint.md`.

---

## DS-002 Compatibility Findings

DS-002 component exports are fully preserved:

- `packages/ui/src/index.ts` exports both `./components` and `./layout` — no DS-002 exports removed ✅
- DS-002 style functions and types re-exported unchanged ✅
- Existing component test file (`component-library.test.tsx`) passes all 10 tests ✅
- DS-003 layout test file includes an explicit backward-compatibility test: `keeps DS-002 exports available` — `Button` and `Badge` are imported from `../src` and verified defined and renderable ✅
- `Section` component imports `Card` from `"../components"` for its `asCard` feature — appropriate DS-002 composition with no over-coupling ✅
- No naming conflicts between layout and component exports verified by successful typecheck ✅

---

## Public API Findings

`packages/ui/src/index.ts` now exports everything from `./components`, `./layout`, `./styles`, and `./types`. The layout public surface is:

- **Components**: all 12 layout primitives ✅
- **Prop types**: all 12 `*Props` interfaces ✅
- **Layout types**: `LayoutGap`, `LayoutDensity`, `LayoutAlign`, `LayoutJustify`, `LayoutMode`, `ContainerSize`, `ContainerPadding`, `GridColumns`, `SplitPanelRatio`, `SectionSpacing`, `PageHeaderVariant` ✅
- **Style functions**: `getAppShellStyle`, `getAppShellSlotStyle`, `getPageShellStyle`, `getHeaderStyle`, `getSidebarStyle`, `getMainContentStyle`, `getContainerStyle`, `getStackStyle`, `getInlineStyle`, `getGridStyle`, `getSplitPanelStyle`, `getSectionStyle`, `getSectionHeaderStyle`, `getPageHeaderStyle`, `getPageTitleStyle`, `getPageDescriptionStyle` ✅
- **Utilities**: `layoutResponsiveCss` (CSS string), `resolveLayoutGap` (token resolver shorthand) ✅

Consumer import ergonomics are good: `import { AppShell, MainContent, Stack, type LayoutGap } from "@nextshift/ui"` works as expected. Style functions are public API, consistent with DS-002's pattern.

---

## Layout Prop Typing Findings

**LayoutGap, LayoutDensity, LayoutAlign, LayoutJustify** — all typed as explicit literal unions. No loose `string` types for design-intent props ✅

**GridColumns** — typed as `1 | 2 | 3 | 4 | 6 | 12 | "auto"` — covers common grid column counts with an auto-fit option. 5 and other values intentionally excluded ✅

**SplitPanelRatio** — `"1:1" | "2:1" | "1:2" | "3:2"` — four common ratios ✅

**ContainerSize / ContainerPadding** — named literal unions (not raw numbers), which maintains semantic alignment with breakpoint tokens ✅

**PageHeaderVariant** — `"default" | "split" | "stacked"` — three intentional layout variants ✅

**`headingLevel?: 1 | 2 | 3`** on PageHeader — numeric literal union prevents invalid heading levels. Dynamic heading tag via `` `h${headingLevel}` as "h1" | "h2" | "h3" `` is correct ✅

**`Grid.minColumnWidth?: string`** — accepts arbitrary CSS values such as `"16rem"`, `"200px"`. Loose type but appropriate since this is a layout constraint dependent on content — see Issues N-003.

**All layout components extend native element `HTMLAttributes`** — full native prop passthrough (`className`, `style`, `id`, `aria-*`, event handlers) ✅

**`children`** typed as `React.ReactNode` where appropriate ✅

**No ref forwarding** on layout components (function components, not `forwardRef`). This is an intentional simplification for DS-003 — comparable to DS-002's Card/Alert/Spinner. See Issues N-004.

---

## Responsive Contract Findings

**Strategy:** A single exported CSS string `layoutResponsiveCss` provides breakpoint-driven layout collapse for AppShell and SplitPanel. No runtime breakpoint detection, no JS resize observers, no context state.

```css
@media (max-width: ${theme.breakpoint.md}) {
  [data-nextshift-layout="app-shell"],
  [data-nextshift-layout="split-panel"] {
    grid-template-columns: minmax(0, 1fr) !important;
  }

  [data-nextshift-layout-sidebar="true"] {
    position: relative !important;
    width: 100% !important;
    min-height: auto !important;
  }
}
```

**Breakpoint token used**: `theme.breakpoint.md` — confirmed via test `layoutResponsiveCss` contains `nextShiftThemeTokens.breakpoint.md` ✅

**`!important` usage**: Necessary because inline styles always take precedence over stylesheets. The `!important` is the only way to override inline styles from CSS media queries without runtime JS. This is an intentional and correct trade-off of the inline-style architecture.

**Attribute selectors are namespaced**: `data-nextshift-layout`, `data-nextshift-layout-sidebar` — no risk of collision with consumer attribute selectors ✅

**Injection**: `layoutResponsiveCss` is injected via `<style>` tags inside `AppShell` (when `layoutMode === "responsive"`) and `SplitPanel` (when `collapseOnSmall === true`). Both default to responsive/collapseOnSmall, so both inject the CSS by default. Multiple instances inject duplicate `<style>` tags — see Issues L-002.

**`layoutMode` prop**: `AppShell` accepts `"fixed"` to skip responsive injection entirely, giving consumers escape hatch. ✅

**Inline style limitations documented**: DS-003 README states "DS-003 provides responsive-friendly inline style contracts and a minimal exported CSS string for AppShell and SplitPanel media-query behavior. It does not introduce breakpoint detection or runtime layout state." ✅

---

## Accessibility Findings

**`<main>` landmark:** `MainContent` renders `<main>` ✅. Per page, there should be only one `<main>` — enforcement is the consumer's responsibility, which is appropriate for a primitive.

**`<header>` landmark:** `Header` renders `<header>` ✅. When `Header` is placed inside `AppShell`'s header slot (wrapped in a `<div>`), the `<header>` remains a page-level banner landmark because `<div>` is not a sectioning element ✅. When `Sidebar` contains an inner `{header ? <header>{header}</header> : null}`, that inner `<header>` is scoped to the `<aside>` landmark context and does not create a second page-level banner ✅.

**`<aside>` landmark:** `Sidebar` renders `<aside>` with `aria-label={label}` (default "Sidebar") ✅. `AppShell` sidebar slot uses `<aside aria-label={sidebarLabel}>` (default "Application sidebar") ✅. Both are labelable.

**Sidebar collapsed state:** `getSidebarStyle` applies `width: spacing["16"]; overflow: hidden` for collapsed state. The sidebar content remains in the DOM and is accessible to screen readers — `overflow: hidden` plus reduced width provides only visual collapse, not accessible hiding. `aria-hidden` or `display: none` would be needed for full accessible collapse. This is DS-007 scope — see Issues N-001.

**`<section>` landmark:** `Section` renders `<section>`. An unnamed `<section>` (no `aria-label`/`aria-labelledby`) is demoted from landmark to generic region by screen readers. This avoids landmark pollution and matches the DS-002 `Card` `<section>` behavior. The inner `<h2>` does NOT automatically become the section's accessible name without `aria-labelledby` pointing to it. Intentional behavior but undocumented — see Issues N-002.

**Heading hierarchy:** `Section` title hardcodes `<h2>` regardless of nesting context — see Issues M-001. `PageHeader` has `headingLevel?: 1 | 2 | 3` (default 1) which correctly allows consumers to set the appropriate level ✅.

**PageHeader heading style vs semantic level:** `getPageTitleStyle()` always applies `typography.scale.heading.h2` font metrics, regardless of `headingLevel`. A `PageHeader` with `headingLevel=1` renders `<h1>` with h2-scale typography. See Issues N-002.

**Focus management:** No `outline: 0` or `outline: none` anywhere in `layout-styles.ts` ✅. No event handlers that would interfere with keyboard navigation ✅.

**DOM order:** `SplitPanel` renders `primary` before `secondary` in DOM — logical reading order ✅. `AppShell` renders header before sidebar before main — correct document order ✅.

---

## Styling Strategy Findings

All layout visual properties are derived from `nextShiftThemeTokens`. No external UI framework introduced. No Tailwind, Radix, shadcn, Material UI, Chakra, or Bootstrap ✅.

`mergeStyles` from `component-styles.ts` is reused in layout style functions — consistent with DS-002 ✅.

Style functions follow the DS-002 pattern: pure functions returning `React.CSSProperties`, all exported as public API, all consumed by components via `mergeStyles(getXStyle(...), style)` ✅.

**One direct JSX inline style found** in `page-shell.tsx:31`:
```tsx
<div style={{ alignItems: "start", display: "flex", justifyContent: "space-between" }}>
```
This inline style is applied directly in JSX rather than through a style function. It uses CSS keywords, not tokens, and there is no `gap` token applied. This bypasses the style contract pattern — see Issues L-001.

**DS-008 theme override readiness:** All layout colors, spacing, and typography come from `nextShiftThemeTokens`. A DS-008 static theme replacing semantic token values would automatically update layout surfaces ✅.

---

## Test Coverage Findings

14 tests in `layout-system.test.tsx`, all passing:

| Test | Coverage |
|---|---|
| `exposes public layout components and types` | All 12 components + type assignment |
| `renders AppShell with header, sidebar, main, and footer` | Structure, `<main>`, aria-label |
| `renders PageShell density and action structure` | data-density, header, actions |
| `renders Header slots` | `<header>`, leading/center/trailing, data-sticky |
| `renders Sidebar collapsed state` | `<aside>`, data-collapsed, aria-label |
| `renders MainContent as semantic main element` | `<main>`, maxWidth, scrollable |
| `renders Container size and padding props` | data-size, data-padding |
| `renders Stack and Inline gap and alignment behavior` | data-gap for both Stack and Inline |
| `renders Grid columns and gap behavior` | data-columns, data-gap |
| `renders SplitPanel ratio and responsive marker` | data-ratio, data-nextshift-layout |
| `renders Section title, actions, and content` | `<section>`, title, description, actions |
| `renders PageHeader variants and actions` | `<h1>`, eyebrow, description, metadata, data-variant |
| `uses DS-001 tokens in layout style contracts` | 6 token usage assertions + layoutResponsiveCss |
| `keeps DS-002 exports available` | Button/Badge defined and renderable |

Combined with the 10 DS-002 tests in `component-library.test.tsx`, total coverage is 24 tests across 2 files.

**Minor coverage gaps (all NOTE-level):**
- `Section` `asCard` variant not tested
- `PageHeader` `headingLevel` 2 and 3 not tested
- `SplitPanel` `collapseOnSmall={false}` not tested (no `<style>` injection path)
- `Grid` `columns="auto"` not tested
- `AppShell` `layoutMode="fixed"` not tested (no responsive CSS injection path)
- `Container` `center={false}` not tested

These are all secondary paths for primitives that have correct primary-path coverage.

---

## Documentation Findings

**DS-003 README** covers: purpose, complete layout primitive list, relationship to DS-001 tokens, relationship to DS-002 components, accessibility baseline, responsive strategy, non-goals, extension model, and example usage. Clear and complete.

**IMPLEMENTATION_REPORT** covers: scope, architecture decision, files created, files modified, test results, typecheck results, known limitations, and backward compatibility statement. Complete.

**Minor documentation gaps (NOTE-level):**
- README does not document that `Section` heading is hardcoded to `<h2>` (no configurable level)
- README does not document that `Section`'s unnamed `<section>` element is not a named landmark by design
- README does not document that `getPageTitleStyle()` uses h2-scale typography for all PageHeader heading levels
- README does not document that ref forwarding is intentionally deferred on layout components

---

## Backward Compatibility Findings

DS-003 is fully backward-compatible with DS-001, DS-002, and CAP-001 through CAP-008.

- All DS-002 component and style exports intact: 10 component tests pass ✅
- DS-001 exports unchanged: 9 shared tests pass ✅
- Domain tests: 31 files / 285 tests pass ✅
- Application tests: 34 files / 211 tests pass ✅
- `@nextshift/ui` remains the same package — no consumers break from a package restructure ✅
- No runtime, governance, database, or business capability behavior modified ✅

---

## Future Slice Readiness

| Slice | Readiness |
|---|---|
| DS-004 Dashboard Framework | ✅ — `AppShell`, `PageShell`, `Section`, `Grid`, `SplitPanel`, `Container` are the core dashboard layout primitives |
| DS-005 Interaction System | ✅ — layout components extend native HTML attributes; interaction tokens (motion, state) can be layered in by DS-005 |
| DS-006 Data Visualization | ✅ — `SplitPanel` and `Grid` handle chart placement; `Section` wraps chart containers |
| DS-007 Accessibility | ⚠️ — two items need DS-007 work: (1) Section heading level must be configurable; (2) Sidebar collapsed state needs accessible hiding via `aria-hidden` |
| DS-008 Theme & Branding | ✅ — all layout colors, typography, and spacing are token-derived; static theme substitution will flow through automatically |

---

## Issues Found

### BLOCKER

None.

### HIGH

None.

### MEDIUM

**M-001**  
**Location:** `packages/ui/src/layout/section.tsx:45`  
**Finding:** `Section` renders the `title` prop as a hardcoded `<h2>` element with no configurable heading level. Unlike `PageHeader` which provides `headingLevel?: 1 | 2 | 3`, `Section` cannot be rendered at `<h1>` or `<h3>` level. This prevents:
1. Correct heading hierarchy when `Section` is used at the primary page level without a `PageHeader` (a lone `<h2>` as the first heading on the page skips h1)
2. Proper nested heading structure when multiple `Section` components with titles are nested or co-used at different depths

This is a WCAG 1.3.1 and 2.4.6 concern for pages relying on Section for their heading structure.  
**Recommendation:** Add `headingLevel?: 1 | 2 | 3` prop (default `2`) to `SectionProps`, mirroring `PageHeader`. Fix in DS-003 patch or early DS-007 prep.

### LOW

**L-001**  
**Location:** `packages/ui/src/layout/page-shell.tsx:31`  
**Finding:** The header/actions row within `PageShell` uses a direct JSX inline style object `{ alignItems: "start", display: "flex", justifyContent: "space-between" }` rather than a named style function. This is the only layout case where style is applied directly in JSX markup instead of via the `get*Style()` contract pattern. There is no token-derived `gap` applied between header and actions, and the `alignItems: "start"` does not use the `alignMap` accessor. Minor inconsistency but bypasses the extendable style contract pattern.  
**Recommendation:** Extract to `getPageShellHeaderStyle()` in `layout-styles.ts`, consuming `theme.spacing["*"]` for gap if desired. Low urgency — no user-visible bug.

**L-002**  
**Location:** `packages/ui/src/layout/app-shell.tsx:41` + `packages/ui/src/layout/split-panel.tsx:35`  
**Finding:** Both `AppShell` (when `layoutMode="responsive"`) and `SplitPanel` (when `collapseOnSmall=true`) inject `<style>{layoutResponsiveCss}</style>` per component instance. The CSS string is identical every time. Pages with multiple AppShell or SplitPanel instances accumulate redundant `<style>` tags. Browsers handle duplicate identical CSS declarations correctly, but it grows the DOM. This is the same per-instance injection issue as Spinner keyframes (DS-002 L-003), now extended to responsive CSS.  
**Recommendation:** Consolidate into a `GlobalStyles` provider for DS-004 or DS-005. The exported `layoutResponsiveCss` string already enables this — consumers can inject it once at the app shell level rather than relying on per-instance injection.

### NOTE

**N-001**  
**Location:** `packages/ui/src/styles/layout-styles.ts:162–180` — `getSidebarStyle`  
**Finding:** Sidebar `collapsed={true}` reduces width to `spacing["16"]` and applies `overflow: hidden`. This is visual-only collapse — sidebar content remains fully accessible to screen readers. Users navigating by keyboard or screen reader in collapsed mode will still encounter all sidebar navigation items. Full accessible collapse requires `aria-hidden="true"` on the sidebar or `display: none` on its content when collapsed.  
**Recommendation:** DS-007 work item. Document the current limitation in the README.

**N-002**  
**Location:** `packages/ui/src/layout/section.tsx:38` + `packages/ui/src/styles/layout-styles.ts:310–319`  
**Finding:** (a) `Section`'s root `<section>` element has no `aria-label` or `aria-labelledby` — it is correctly demoted from a named landmark to a generic region by screen readers, avoiding landmark pollution. This is intentional behavior but is not documented in the README. (b) `getPageTitleStyle()` is shared between `Section` (always `<h2>`) and `PageHeader` (dynamic heading level). When `PageHeader` uses `headingLevel=1`, it renders `<h1>` with h2-scale typography. For `headingLevel=3`, it renders `<h3>` with h2 visual size. The visual scale does not track the semantic level.  
**Recommendation:** Document the intentional landmark behavior in the README. For (b), consider naming the style function `getSectionTitleStyle()` vs `getPageHeaderTitleStyle()` so they can diverge if needed in DS-007/DS-008.

**N-003**  
**Location:** `packages/ui/src/layout/grid.tsx:9` — `minColumnWidth?: string`  
**Finding:** `Grid.minColumnWidth` is typed as `string`, accepting arbitrary CSS values (`"16rem"`, `"200px"`, `"10vw"`, etc.). This is appropriate since minColumnWidth is a content-dependent constraint with no DS-001 token equivalent, but it is a loose type in an otherwise literal-union-typed API surface. The default `"16rem"` may or may not match consumer needs.  
**Recommendation:** Document common values and the rem/px convention in the README. Acceptable as-is for DS-003.

**N-004**  
**Location:** All layout components — function components rather than `forwardRef`  
**Finding:** None of the 12 layout components use `forwardRef`. Consumers cannot attach refs to layout DOM elements without additional wrapper code. This is an intentional simplification consistent with DS-002's Card/Alert/Spinner pattern. Ref forwarding would be needed for DS-005 scroll-anchor behaviors, focus management, and intersection observers.  
**Recommendation:** DS-005 or DS-007 work item. Add `forwardRef` to at least `AppShell`, `MainContent`, and `Sidebar` as they are likely targets for scroll and focus management.

---

## Required Fixes Before Release

None.

---

## Recommended Follow-ups

1. **(DS-003 patch / DS-007 prep)** Add `headingLevel?: 1 | 2 | 3` (default `2`) to `SectionProps` — resolves M-001.
2. **(DS-003 patch)** Extract `PageShell` header/actions row inline style to `getPageShellHeaderStyle()` in `layout-styles.ts` — resolves L-001.
3. **(DS-004 / DS-005)** Introduce `GlobalStyles` provider or single-injection pattern for `layoutResponsiveCss` and `nextShiftUiKeyframes` — resolves L-002 and DS-002 L-003 together.
4. **(DS-005 / DS-007)** Add `forwardRef` to `AppShell`, `MainContent`, and `Sidebar` for scroll anchor and focus management support — resolves N-004.
5. **(DS-007)** Sidebar collapsed state: add `aria-hidden` or `visibility: hidden` on collapsed content to hide it from screen readers — resolves N-001.
6. **(DS-003 docs)** Add to README: Section heading level is fixed at `h2`; unnamed `<section>` is intentionally non-landmark; Sidebar collapsed content is DOM-visible to screen readers; layout components don't use forwardRef.
7. **(Any DS slice)** Test `Section asCard`, `PageHeader headingLevel`, `SplitPanel collapseOnSmall=false`, `Grid columns="auto"`, `AppShell layoutMode="fixed"`.

---

## Final Recommendation

**DS-003 Layout System is production-ready. Proceed to Verification and Release.**

The implementation is correctly scoped, token-driven, backward-compatible, accessible at baseline, and structurally sound. The one MEDIUM finding (Section heading level hardcoded to `<h2>`) is a real limitation that should be patched early but does not block the primitive release. The LOWs and NOTEs are forward-looking improvements for DS-004 through DS-007.
