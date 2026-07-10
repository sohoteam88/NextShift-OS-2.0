# DS-007 Accessibility Audit Report

**Audit Type:** Independent Code + Architecture Audit  
**Auditor:** Claude Code (Independent Architecture Auditor)  
**Date:** 2026-06-29  
**Project:** NextShift OS 3.1 / NextShift Design System v1.0  
**Slice:** DS-007 Accessibility

---

## Audit Result

**PASS WITH MINOR NOTES**

---

## Executive Summary

DS-007 Accessibility is a correctly scoped, framework-neutral utility layer that provides the reusable accessibility foundation for `@nextshift/ui`. All eleven required utility groups are implemented and exported: focus trap, focus scope, roving focus, landmark helpers, accessible ID utilities, ARIA helpers, screen reader helpers, live regions, reduced motion, high contrast, and validation. DS-001 through DS-006 exports are untouched; 60/60 tests pass with zero typecheck errors across all four packages. The WCAG contrast threshold math is correct. The controller-pattern approach to focus management — returning a controller object rather than attaching DOM listeners — is the right architectural choice for a framework-neutral utility: it avoids hidden global state and lets consumers wire the trap to any framework's event system. Three LOW findings and six NOTEs cover documentation gaps, a deprecated visually-hidden CSS property, an `aria-selected` semantic edge case, and carry-forward component patches that remain deferred. No blockers, no HIGH issues, no runtime or business scope violations.

---

## Files Inspected

```
packages/ui/src/accessibility/aria.ts
packages/ui/src/accessibility/contrast.ts
packages/ui/src/accessibility/focus-scope.ts
packages/ui/src/accessibility/focus.ts
packages/ui/src/accessibility/ids.ts
packages/ui/src/accessibility/index.ts
packages/ui/src/accessibility/landmarks.tsx
packages/ui/src/accessibility/live-region.tsx
packages/ui/src/accessibility/motion.ts
packages/ui/src/accessibility/roving-focus.ts
packages/ui/src/accessibility/screen-reader.tsx
packages/ui/src/accessibility/validation.ts
packages/ui/src/styles/accessibility-styles.ts
packages/ui/src/types/accessibility-types.ts
packages/ui/src/index.ts
packages/ui/src/styles/index.ts
packages/ui/src/types/index.ts
packages/ui/src/styles/component-styles.ts (visuallyHiddenStyle source)
packages/ui/src/styles/interaction-styles.ts (getMotionTransition source)
packages/ui/test/accessibility-system.test.tsx
packages/ui/test/component-library.test.tsx (prior compatibility)
packages/ui/test/layout-system.test.tsx (prior compatibility)
packages/ui/test/dashboard-framework.test.tsx (prior compatibility)
packages/ui/test/interaction-system.test.tsx (prior compatibility)
packages/ui/test/data-visualization.test.tsx (prior compatibility)
docs/nextshift-os-3/design-system/slices/DS-007-accessibility/README.md
docs/nextshift-os-3/design-system/slices/DS-007-accessibility/IMPLEMENTATION_REPORT.md
```

---

## Commands Executed

| Command | Result |
|---|---|
| `pnpm --filter @nextshift/ui test` | ✅ PASS — 6 files / 60 tests |
| `pnpm --filter @nextshift/ui typecheck` | ✅ PASS — 0 errors |
| `pnpm --filter @nextshift/shared test` | ✅ PASS — 1 file / 9 tests |
| `pnpm --filter @nextshift/shared typecheck` | ✅ PASS — 0 errors |
| `pnpm --filter @nextshift/domain test` | ✅ PASS — 31 files / 285 tests |
| `pnpm --filter @nextshift/domain typecheck` | ✅ PASS — 0 errors |
| `pnpm --filter @nextshift/application test` | ✅ PASS — 34 files / 211 tests |
| `pnpm --filter @nextshift/application typecheck` | ✅ PASS — 0 errors |

---

## Scope Boundary Findings

DS-007 stayed within scope. No violations found.

Confirmed absent: runtime redesign, governance changes, database changes, backend APIs, business capability changes, routing, data fetching, state persistence, global app-shell state, external accessibility framework dependencies (no axe-core, no @radix-ui/react-focus-scope, no focus-trap library), new UI framework dependencies, business UI, theme switcher UI, unrelated refactors. The only non-pure-utility choice is a cross-slice dependency: `motion.ts` imports `getMotionTransition` via `../styles`, which re-exports it from `interaction-styles.ts`. This is an intra-package import, not a dependency violation — DS-007 is inside the same `@nextshift/ui` package ✅.

The slice adds 12 files (11 source + 1 test) and updates 3 existing barrel files. All new files are utility-only.

---

## Package Extension Findings

DS-007 correctly extends `@nextshift/ui` without creating a second package or adding dependencies:

- New `packages/ui/src/accessibility/` directory — 12 files (12 modules + barrel) ✅
- New `packages/ui/src/styles/accessibility-styles.ts` ✅
- New `packages/ui/src/types/accessibility-types.ts` ✅
- `packages/ui/src/index.ts` updated with `export * from "./accessibility"` — additive only ✅
- `packages/ui/src/styles/index.ts` updated with 5 accessibility style function exports — additive only ✅
- `packages/ui/src/types/index.ts` updated with 10 accessibility type exports — additive only ✅
- `packages/ui/package.json`, `tsconfig.json`, `vitest.config.ts` unchanged ✅

Reported cleanup (removing `packages/ui/node_modules` and `tsconfig.tsbuildinfo`) is appropriate — these are build artifacts, not committed files. ✅

All DS-002 through DS-006 exports remain intact. All 51 prior tests pass alongside 9 new DS-007 tests ✅.

---

## Accessibility Coverage Findings

All eleven required utility groups are implemented and exported:

| Utility Group | File(s) | Status |
|---|---|---|
| Focus trap | `focus.ts` | ✅ `createFocusTrap`, `getFocusableElements`, `isElementFocusable`, `focusElement`, `focusableSelector` |
| Focus scope | `focus-scope.ts` | ✅ `createFocusScope` — adds `focusById` over trap |
| Roving focus | `roving-focus.ts` | ✅ `getNextRovingFocusIndex`, `getRovingFocusDirectionForKey`, `getRovingFocusItemProps`, `getRovingTabIndex` |
| Landmark helpers | `landmarks.tsx` | ✅ `Landmark` component + `getLandmarkProps` |
| Accessible ID utilities | `ids.ts` | ✅ `createAccessibleId`, `createAccessibleIdFactory`, `mergeAccessibleIds`, `getAccessibleFieldIds`, `sanitizeAccessibleIdPart` |
| ARIA helpers | `aria.ts` | ✅ 7 prop-builder functions |
| Screen reader helpers | `screen-reader.tsx` | ✅ `VisuallyHidden` component + `createScreenReaderText` |
| Live region helpers | `live-region.tsx` | ✅ `LiveRegion` component + `getLiveRegionProps` + `createLiveRegionMessage` |
| Reduced motion | `motion.ts` | ✅ `shouldReduceMotion`, `getReducedMotionTransition`, `getReducedMotionStyle` |
| High contrast | `contrast.ts` + styles | ✅ `getHighContrastStyle`, `getHighContrastOutlineStyle`, `getAccessibleFocusStyle`, `getContrastRatio`, `meetsContrast` |
| Validation utilities | `validation.ts` | ✅ `validateAccessibleName`, `validateLandmarkSemantics`, `validateAriaReferences` |

All utilities are minimal, typed, reusable, and contain no business semantics ✅.

---

## Focus Trap / Focus Scope Findings

**Architecture:** `createFocusTrap` follows a controller pattern — it returns an object with `{ activate, deactivate, focusFirst, focusLast, handleKeyDown }`. No DOM listeners are attached. The consumer wires `handleKeyDown` to their element's `onKeyDown` prop or event listener. This is the correct design for a framework-neutral utility and is consistent with how DS-005's `useKeyboardActivation` hook works.

**Focusable element query:**
```ts
export const focusableSelector = [
  "a[href]", "area[href]", "button:not([disabled])", "input:not([disabled])",
  "select:not([disabled])", "textarea:not([disabled])", "iframe", "object",
  "embed", "[contenteditable]", "[tabindex]",
].join(",");
```
The selector includes `[tabindex]` (any value), which matches elements with `tabindex="-1"`. These are then filtered out by `isElementFocusable` which checks `element.tabIndex >= 0`. Correct result; slight query inefficiency (disabled elements are also queried by some selectors then re-filtered). Not a bug.

**isElementFocusable:** Checks the `disabled` HTML attribute, the `hidden` HTML attribute, and `aria-hidden="true"`. Does NOT exclude elements hidden via CSS (`display: none`, `visibility: hidden`). In practice, browsers ignore `focus()` calls on `display: none` elements (call silently no-ops). Elements with `visibility: hidden` can receive programmatic focus in some browser/context combinations, causing the trap to appear to lose focus. This is a known limitation shared by most DOM-based focus trap utilities and should be documented — see Issues L-001.

**Tab wrapping:** `handleKeyDown` correctly wraps at both ends using the ownerDocument's `activeElement`:
- `Shift+Tab` when first → focus last ✅
- `Tab` when last → focus first ✅
- Empty focusable list → `preventDefault()` and focus fallback ✅

**Initial focus:** `activate()` saves `previouslyFocused = ownerDocument.activeElement` then calls `focusFirst()`. `focusFirst()` prefers `options.initialFocus`, falls back to first focusable element, then `options.fallbackFocus`. Deterministic ✅.

**Return focus:** `deactivate()` returns focus to `previouslyFocused` unless `options.returnFocus === false`. Default is `true` (returnFocus on deactivate) ✅. The `previouslyFocused` is typed as `Element | null` and cast to `HTMLElement | null` for `focusElement` — safe since only HTMLElements respond to `.focus()`.

**Escape handling:** Not built into the trap. The spec correctly defers Escape to the consuming component (DS-005 Modal/Dialog handle Escape via their own `onKeyDown`). ✅

**SSR safety:** `getFocusableElements` guards `typeof root.querySelectorAll !== "function"` and returns `[]`. `focusElement` uses optional chaining `element?.focus?.()`. `getActiveElement` uses `root.ownerDocument?.activeElement`. All SSR-safe ✅.

**Cleanup:** No event listeners registered → no cleanup needed. Controller objects are GC-eligible when references are dropped ✅.

**Focus scope** adds `focusById(id: string): boolean` over the trap — finds a focusable element by ID and focuses it, returning false if not found. Clean, correct ✅.

---

## Roving Focus Findings

**Direction mapping (`getRovingFocusDirectionForKey`):**
- `Home` → `"first"` ✅
- `End` → `"last"` ✅
- `ArrowRight` / `ArrowLeft` for `"horizontal"` or `"both"` ✅
- `ArrowDown` / `ArrowUp` for `"vertical"` or `"both"` ✅
- Any unrecognized key → `undefined` ✅

**Index traversal (`getNextRovingFocusIndex`):**
- `"first"` → scans from index 0, returns first non-disabled index ✅
- `"last"` → scans from `itemCount-1` down, returns last non-disabled index ✅
- `"next"` / `"previous"` → iterates with step ±1, skips disabled indexes ✅
- Loop enabled: wraps at boundaries ✅
- Loop disabled: returns `currentIndex` unchanged at boundary ✅
- Empty list (`itemCount <= 0`): returns `-1` ✅
- All items disabled: returns `currentIndex` after exhausting `itemCount` iterations ✅ (correct — maintains current position)

**`getRovingFocusItemProps`:** Returns `tabIndex` (0 or -1), `aria-disabled`, `aria-selected`, and `data-roving-focus-item` marker. `aria-selected` is set from `options.selected` — when `undefined` (not passed), React omits the attribute. If a consumer passes `selected: false`, `aria-selected="false"` renders on the element. `aria-selected` is semantically correct only for selectable roles (`role="tab"`, `role="option"`, `role="row"`, `role="gridcell"`). On `role="menuitem"` or `role="treeitem"`, `aria-selected` may trigger invalid ARIA warnings. The helper function is generic and cannot enforce role context. — see Issues L-002.

**No global state:** All state is parameter-driven (`currentIndex`, `itemCount`, `disabledIndexes`). The consumer owns state ✅.

**Usability:** The decomposed API (`getRovingFocusDirectionForKey` → `getNextRovingFocusIndex` → `getRovingFocusItemProps`) is clean and composable for menus, tabs, toolbars, and grids. Orientation is a first-class parameter ✅.

---

## Landmark / ARIA Helper Findings

**`getLandmarkProps`:**
```ts
return {
  "aria-label": options.label,         // undefined when not set
  "aria-labelledby": options.labelledBy, // undefined when not set
  role: options.role,
};
```
When neither label nor labelledBy is provided, the returned object contains explicit `undefined` values for both aria fields. In React, undefined props are omitted from the DOM. In imperative DOM usage, callers receive `{ role: "region", "aria-label": undefined, "aria-labelledby": undefined }` and must filter undefined values themselves. Low-impact in practice — see Issues N-003.

**`Landmark` component:** Uses the `as` prop for polymorphic rendering. Default is `as="section"` with `roleName="region"`. A `<section role="region">` without an accessible name may not be exposed as a landmark by screen readers (Lighthouse and NVDA both skip unnamed regions). Consumers who use `<Landmark>` without providing `label` or `labelledBy` get a structurally silent element. `validateLandmarkSemantics` would catch this if consumers run validation — see Issues L-003.

**`AccessibilityLandmarkRole` union** — covers all eight ARIA landmark roles: `"banner" | "complementary" | "contentinfo" | "form" | "main" | "navigation" | "region" | "search"`. Does not include `"toolbar"` (a widget role, not a landmark). The DS-004 DashboardToolbar/FilterBar carry-forward (wanting `role="toolbar"`) is outside this type — see Prior Carry-Forward section.

**`getLandmarkProps` with both label and labelledBy:** The function allows passing both. Per ARIA spec, `aria-labelledby` takes precedence over `aria-label` when both are present. No warning or enforcement — acceptable in a utility layer but worth documenting.

**`getAriaLabelProps`, `getAriaDescriptionProps`, `getAriaExpandedProps`, `getAriaPressedProps`, `getAriaInvalidProps`, `getAriaBusyProps`, `getDisabledAriaProps`:** All helpers return narrowly typed prop objects. They use `|| undefined` where appropriate to avoid emitting false/null attribute values:
- `getAriaBusyProps(false)` → `{ "aria-busy": undefined }` — React omits ✅
- `getAriaInvalidProps(false)` → `{ "aria-invalid": undefined, "aria-errormessage": undefined }` ✅
- `getDisabledAriaProps(false)` → `{ "aria-disabled": undefined, tabIndex: undefined }` ✅
- `getAriaExpandedProps(false, undefined)` → `{ "aria-expanded": false, "aria-controls": undefined }` — `aria-expanded` renders as `"false"` in the DOM, which is correct for expandable controls ✅

**Important nuance**: `getAriaDescriptionProps` links `aria-errormessage={errorId}` when `invalid`, but does NOT set `aria-invalid`. Consumers must also call `getAriaInvalidProps` to mark the field as invalid. `aria-errormessage` without `aria-invalid="true"` is not announced by all screen reader / browser combinations. See Issues N-004.

---

## Accessible ID Findings

**`createAccessibleId(prefix, ...parts)`:** Joins prefix + parts after sanitizing each part (strips non-alphanumeric/dash/underscore chars, trims leading/trailing dashes). `undefined` parts are filtered. Empty parts after sanitization are also filtered. Correct ✅.

Example: `createAccessibleId("field", "Customer Name")` → `"field-Customer-Name"`. Spaces become dashes. ✅

**`mergeAccessibleIds(...ids)`:** Splits each id string on whitespace, flattens, deduplicates via `Set`, rejoins. Returns `undefined` if no non-empty IDs remain. This is the correct utility for building `aria-labelledby` and `aria-describedby` from multiple contributor strings ✅.

Example: `mergeAccessibleIds("a b", "b c")` → `"a b c"` (deduplicated) ✅

**`getAccessibleFieldIds(baseId)`:** Returns `{ inputId, labelId, descriptionId, errorId }` — the exact four IDs needed to wire DS-002 form controls (`Input`, `Textarea`, `Select`) with labels, helper text, and error text. Directly addresses DS-002 carry-forward (form controls lacking `id`/`name` for ARIA linking) ✅.

**`createAccessibleIdFactory(prefix)`:** Creates a per-factory incrementing ID generator. Each factory call returns a closure with its own `nextId` counter. When multiple factories exist (one per component instance), IDs are isolated. Correctly avoids the `React.useId()` constraint — this factory does not require a React context and can be used outside React ✅. However, if a factory is created at module level (a shared singleton), the counter increments across all uses in the same module scope, including across SSR render passes. SSR implications are not documented — see Issues N-002.

**`sanitizeAccessibleIdPart`:** Sanitizes the string with a clean regex then trims leading/trailing dashes. Handles integers, strings with special characters, and unicode text ✅.

**SSR safety:** These are pure functions with no DOM access ✅.

---

## Screen Reader / Live Region Findings

**`VisuallyHidden`:**
```ts
export const visuallyHiddenStyle: React.CSSProperties = {
  position: "absolute",
  width: 1, height: 1, padding: 0, margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
};
```
The `clip: rect(0,0,0,0)` property is deprecated. Modern screen-reader-only technique uses `clip-path: inset(50%)` with `white-space: nowrap; overflow: hidden`. The deprecated `clip` property is still supported in all major browsers as of 2026, so this is not a functional issue. However, adding `clipPath: "inset(50%)"` would future-proof the implementation — see Issues L-004.

**`VisuallyHidden` component:** Renders a `<span>` with `data-nextshift-accessibility="visually-hidden"`, allows `style` override via `mergeStyles`, and spreads remaining HTML props. Consumers can use it for SR-only labels, announcements, or icon button descriptions ✅.

**`createScreenReaderText(label, detail)`:** Joins with `. ` separator (full stop + space), useful for constructing compound accessible names. Convention follows ARIA authoring practices ✅.

**`LiveRegion` component:**
```tsx
<div
  data-nextshift-accessibility="live-region"
  style={mergeStyles(getLiveRegionStyle(visible), style)}
  {...getLiveRegionProps({ politeness, role: regionRole, atomic })}
  {...props}
>
  {children}
</div>
```
- Default: `politeness="polite"`, `regionRole="status"`, `atomic=true` — correct defaults for general notifications.
- Assertive auto-maps to `role="alert"` — correct per ARIA (alert role implies `aria-live="assertive"`).
- `visible=false` (default) → uses visually-hidden style, content is announced without visual display. `visible=true` → uses typography-styled visible container ✅.
- `atomic=true` default is correct for status messages (the whole region is read when updated) ✅.

**`getLiveRegionProps`:**
```ts
return {
  "aria-atomic": options.atomic ?? true,
  "aria-live": options.politeness ?? "polite",
  role: options.role ?? "status",
};
```
`aria-live` and `role` together on the same element: `role="status"` implies `aria-live="polite"`, `role="alert"` implies `aria-live="assertive"`. Setting both is redundant but harmless; all screen readers handle the redundancy ✅.

**Prior nested live-region carry-forward:** `LiveRegion` provides the correct primitive for fixing DS-004 `DashboardLoadingState` (nested `role="status"`) and DS-005 `LoadingOverlay`. Neither component has been patched in this release — see Prior Carry-Forward section. Consumers building new loading patterns should use `LiveRegion` directly.

---

## Reduced Motion / High Contrast Findings

**`shouldReduceMotion(preference, matcher)`:**
- `"always"` → `true` immediately, ignores matcher ✅
- `"never"` → `false` immediately, ignores matcher ✅
- `"system"` → `matcher?.matches ?? false` — returns `false` when no matcher is provided (safe default for SSR environments that have no `window.matchMedia`) ✅

**Consumer pattern:** In browser, pass `window.matchMedia("(prefers-reduced-motion: reduce)")` as `matcher`. This is intentionally not done automatically inside the utility, keeping it framework-neutral and testable without DOM ✅.

**`getReducedMotionTransition(properties, options)`:** When motion is reduced → `"none"`. Otherwise delegates to `getMotionTransition(properties, speed)` from DS-005 interaction styles, which builds a CSS `transition` string from DS-001 `theme.motion.duration[speed]` and `theme.motion.easing.standard` tokens. Full token-chain preserved ✅.

**`getReducedMotionStyle(reduced)`:** Returns `{ animation: "none", scrollBehavior: "auto", transition: "none" }` when reduced, `{}` otherwise. Correct CSS properties to suppress motion ✅.

**`getHighContrastStyle(enabled)`:**
```ts
return enabled ? {
  background: theme.color.background,
  borderColor: theme.color.foreground,
  color: theme.color.foreground,
} : {};
```
Token-driven ✅. JS-controlled, not `@media (forced-colors: active)` CSS. This is a consumer-controlled high-contrast toggle, not a system-preference responder. The distinction matters: Windows High Contrast Mode (forced-colors) overrides inline styles, so this utility is primarily for a soft "high contrast mode" toggle in the app UI. This is the correct design for an inline-style system, but should be documented — consumers must understand this does not handle forced-colors automatically.

**`getHighContrastOutlineStyle(enabled)`:** Returns `{ outlineColor: theme.color.foreground, outlineStyle: "solid", outlineWidth: theme.state.focus.outlineWidth, outlineOffset: theme.state.focus.outlineOffset }` when enabled. Token-driven ✅. Reuses the focus token slot for outline geometry, which is correct.

**`getAccessibleFocusStyle(highContrast)`:** Standard focus ring:
```ts
{
  outlineColor: highContrast ? theme.color.foreground : theme.color.info,
  outlineOffset: theme.state.focus.outlineOffset,
  outlineStyle: "solid",
  outlineWidth: theme.state.focus.outlineWidth,
}
```
High-contrast mode adds an inner shadow: `boxShadow: \`0 0 0 ${theme.state.focus.outlineWidth} ${theme.color.background}\`` — this creates a white halo inside the outline ring, making it visible on any background color. This is the correct double-ring technique for high-contrast keyboard focus ✅. All values are token-derived ✅.

---

## Validation Utility Findings

**`validateAccessibleName(options)`:** Checks `ariaLabel`, `ariaLabelledBy`, `title`, or `text` — returns error if none present after trimming. Conservative (any non-empty source is sufficient). Correct approach: a utility that flags definitely-missing names without complex DOM traversal ✅.

**`validateLandmarkSemantics(options)`:** Requires accessible names for `"complementary"`, `"form"`, `"navigation"`, `"region"`, `"search"`. Does not require names for `"banner"`, `"main"`, `"contentinfo"` — correct per ARIA authoring practices (page-unique landmarks don't need names). Slightly stricter than WCAG (requires names even for single-instance landmarks), but conservative is the right approach for a utility ✅.

**`validateAriaReferences(options)`:** Compares `referencedIds` against `availableIds` array. Flags any missing. Returns one issue per missing ID. Consumers must provide both lists — the utility is DOM-free and can be used in tests or developer tooling ✅.

**No overclaiming:** None of the validation utilities claim to certify WCAG compliance. They return typed `{ valid: boolean, issues: readonly AccessibilityValidationIssue[] }` objects with actionable `code` + `message` per issue. The `severity` field is `"error" | "warning"`, with `valid` derived from absence of errors. Correct and conservative ✅.

**SSR-safe:** All utilities are pure functions with no DOM access ✅.

**`getRelativeLuminance` / `getContrastRatio` / `meetsContrast`:**
The WCAG 2.1 contrast threshold logic is correct:

| compliance | largeText | threshold |
|---|---|---|
| `"AA"` | `false` | 4.5 ✅ |
| `"AA"` | `true` | 3.0 ✅ |
| `"AAA"` | `false` | 7.0 ✅ |
| `"AAA"` | `true` | 4.5 ✅ |

Luminance formula: `0.2126 * R + 0.7152 * G + 0.0722 * B` after gamma linearization — correct WCAG 2.1 relative luminance formula. Threshold comparison: `<=0.03928` linearization breakpoint — correct per WCAG 2.1 (sRGB specification). `parseHexColor` accepts `#rgb` (expands to `#rrggbb`) and `#rrggbb`. Throws on invalid input ✅.

`meetsContrast("#000000", "#ffffff")` → ratio > 20, returns `true` ✅ (verified by test).

---

## Prior Carry-Forward Issue Findings

The table below summarizes each carry-forward accessibility issue from DS-002 through DS-006 and its disposition in DS-007:

| Issue | From | DS-007 Response | Status |
|---|---|---|---|
| Card/section landmark density | DS-002 | `Landmark` component + `getLandmarkProps` available | Tools provided; DS-002 components not patched |
| Form controls lacking ARIA linking IDs | DS-002 | `getAccessibleFieldIds(baseId)` directly addresses this | **Addressed via new utility** ✅ |
| Section heading level configurability | DS-003 | Not addressed by DS-007 | Carry-forward |
| Sidebar collapsed content accessible to SR | DS-003 | Not addressed by DS-007 | Carry-forward |
| DashboardLoadingState nested role=status | DS-004 | `LiveRegion` provides correct pattern; DS-004 component not patched | Tools provided; patch deferred |
| DashboardToolbar/FilterBar role=toolbar + aria-label | DS-004 | `AccessibilityLandmarkRole` excludes `toolbar` (widget role); no helper provided | Carry-forward — NOTE N-005 |
| WidgetHeader heading level configurability | DS-004 | Not addressed by DS-007 | Carry-forward |
| Modal/Dialog focus trap | DS-005 | `createFocusTrap` provides the utility; DS-005 Modal/Dialog not patched | Tools provided; patch deferred |
| Dropdown roving focus | DS-005 | `getRovingFocusDirectionForKey` + `getNextRovingFocusIndex` provide utilities; DS-005 Dropdown not patched | Tools provided; patch deferred |
| LoadingOverlay nested role=status | DS-005 | `LiveRegion` provides correct pattern; DS-005 component not patched | Tools provided; patch deferred |
| Legend list semantics | DS-006 | Not addressed by DS-007 | Carry-forward |
| VisualizationLoadingState nested role=status | DS-006 | `LiveRegion` provides correct pattern; DS-006 component not patched | Tools provided; patch deferred |
| Sparkline generic label guidance | DS-006 | Not addressed by DS-007 | Carry-forward — documented in DS-007 README? No; not mentioned |

**Assessment:** DS-007 correctly defines its role as a utility foundation rather than a batch-patcher of prior components. The form field ARIA linking gap from DS-002 is directly addressed with `getAccessibleFieldIds`. For the focus trap and roving focus issues in DS-005, DS-007 provides the exact utilities needed — patching DS-005 components to consume them is appropriate follow-up work. The nested `role="status"` pattern in DS-004/DS-005/DS-006 needs component-level patches, not new utilities. None of the deferred items are DS-007 failures; they are documented as future work.

One gap: the README does not list which prior carry-forwards are addressed versus deferred. This creates ambiguity about DS-007's position in the remediation sequence — see Issues N-006.

---

## Token / Styling Findings

All accessibility styles consume DS-001 tokens. No hardcoded arbitrary visual values found.

| Style function | Tokens consumed |
|---|---|
| `getSkipLinkStyle(focused)` | `color.surface`, `color.info`, `radius.md`, `elevation.md`, `color.foreground`, `spacing["4"]`, `spacing["2"]`, `spacing["3"]`, `zIndex.modal` |
| `getLiveRegionStyle(visible)` | `color.foreground`, `typography.fontFamily.sans`, `typography.fontSize.sm`, `typography.lineHeight.normal` |
| `getHighContrastOutlineStyle(enabled)` | `color.foreground`, `state.focus.outlineOffset`, `state.focus.outlineWidth` |
| `getAccessibleFocusStyle(highContrast)` | `color.info`, `color.foreground`, `color.background`, `state.focus.outlineOffset`, `state.focus.outlineWidth` |
| `getHighContrastStyle(enabled)` | `color.background`, `color.foreground` |
| `getReducedMotionTransition(...)` | `motion.duration[speed]`, `motion.easing.standard` (via `getMotionTransition`) |

`getVisuallyHiddenStyle()` returns a spread of `visuallyHiddenStyle` — a fixed CSS technique with no token equivalents (position absolute, 1px dimensions, etc.). This is correct: the visually-hidden pattern is a fixed technique, not a configurable token space ✅.

Focus ring uses `theme.state.focus.outlineWidth` and `theme.state.focus.outlineOffset` from DS-001 `semanticTokens.state.focus` — consistent with DS-005 `getFocusRingStyle()`. ✅

---

## Public API Findings

`packages/ui/src/index.ts` exposes all DS-007 content via `export * from "./accessibility"`.

**Functions:**
- Focus: `createFocusTrap`, `createFocusScope`, `getFocusableElements`, `isElementFocusable`, `focusElement`, `focusableSelector` ✅
- Roving focus: `getNextRovingFocusIndex`, `getRovingFocusDirectionForKey`, `getRovingFocusItemProps`, `getRovingTabIndex` ✅
- ARIA: `getAriaLabelProps`, `getAriaDescriptionProps`, `getAriaExpandedProps`, `getAriaPressedProps`, `getAriaInvalidProps`, `getAriaBusyProps`, `getDisabledAriaProps` ✅
- IDs: `createAccessibleId`, `createAccessibleIdFactory`, `mergeAccessibleIds`, `getAccessibleFieldIds`, `sanitizeAccessibleIdPart` ✅
- Contrast: `getContrastRatio`, `getRelativeLuminance`, `parseHexColor`, `meetsContrast` ✅
- Motion: `shouldReduceMotion`, `getReducedMotionTransition`, `getReducedMotionStyle` ✅
- Validation: `validateAccessibleName`, `validateLandmarkSemantics`, `validateAriaReferences` ✅
- Helpers: `getLandmarkProps`, `getLiveRegionProps`, `createScreenReaderText`, `createLiveRegionMessage` ✅

**Components:**
- `Landmark`, `LiveRegion`, `VisuallyHidden` ✅

**Style functions (via styles barrel):**
- `getVisuallyHiddenStyle`, `getSkipLinkStyle`, `getLiveRegionStyle`, `getHighContrastOutlineStyle`, `getAccessibleFocusStyle` ✅

**Types:**
- `AccessibilityLandmarkRole`, `AccessibilityLiveRegionPoliteness`, `AccessibilityLiveRegionRole`, `AccessibilityValidationIssue`, `AccessibilityValidationResult`, `AccessibleNameOptions`, `ContrastCompliance`, `ReducedMotionPreference`, `RovingFocusDirection`, `RovingFocusOrientation` ✅
- `FocusTrapController`, `FocusTrapOptions`, `FocusScopeController`, `LandmarkProps`, `LiveRegionProps`, `RovingFocusOptions`, `VisuallyHiddenProps` ✅

Consumer import `import { createFocusTrap, LiveRegion, VisuallyHidden, getAccessibleFieldIds, meetsContrast } from "@nextshift/ui"` resolves correctly ✅.

No internal utilities leaked. `normalizeHex`, `toLinearChannel`, `isDisabled`, `result` (validation helper) are all file-private ✅.

---

## Type Safety Findings

All types use `readonly` properties and readonly arrays ✅. Literal unions are used throughout:
- `RovingFocusDirection = "first" | "last" | "next" | "previous"` ✅
- `RovingFocusOrientation = "horizontal" | "vertical" | "both"` ✅
- `ReducedMotionPreference = "system" | "always" | "never"` ✅
- `ContrastCompliance = "AA" | "AAA"` ✅
- `AccessibilityLiveRegionPoliteness = "off" | "polite" | "assertive"` ✅
- `AccessibilityLiveRegionRole = "status" | "alert" | "log"` ✅

**`FocusTrapController`:** All methods typed explicitly. `handleKeyDown` accepts `Pick<KeyboardEvent, "key" | "shiftKey" | "preventDefault">` — testable without real keyboard events ✅.

**`getRovingFocusItemProps` return type:** Correctly typed as a pick of `React.HTMLAttributes<HTMLElement>` plus the custom `data-roving-focus-item` attribute. TypeScript enforces the return shape ✅.

**`getContrastRatio`** returns `number`. `meetsContrast` returns `boolean`. `parseHexColor` returns `readonly [number, number, number]` — tuple type correctly enforces 3-element RGB ✅.

**`AccessibilityValidationIssue.severity`:** `"error" | "warning"` — the `const "error" as const` assertion on the inline object literal in `validateAriaReferences` is correct and avoids type widening to `string` ✅.

**`LandmarkProps.as`:** Typed as `"aside" | "div" | "footer" | "form" | "header" | "main" | "nav" | "section"` — prevents invalid HTML element selection ✅.

**No misleading types.** Validation utilities return `AccessibilityValidationResult`, not `WCAGResult` or `ComplianceReport`. The type names correctly imply utility-level checks, not standards certification ✅.

---

## Test Coverage Findings

9 new tests in `accessibility-system.test.tsx` (60 total vs 51 prior):

| Test | Coverage |
|---|---|
| `exposes accessibility helpers, components, and types` | Type assignments + component + validation + focusTrap constructor |
| `manages focus trap boundaries and focus scopes` | `activate`, `handleKeyDown` tab-wrap, `focusById` hit/miss |
| `filters focusable elements` | `getFocusableElements`, `isElementFocusable` for normal and -1 tabindex |
| `resolves roving focus and keyboard navigation` | `getRovingTabIndex`, `getNextRovingFocusIndex` (with disabled), `previous` wrap, `ArrowDown`, `Home`, `getRovingFocusItemProps` |
| `renders landmarks, screen reader helpers, and live regions` | `Landmark`, `VisuallyHidden`, `LiveRegion` markup |
| `provides ID, ARIA, landmark, and live-region helpers` | `createAccessibleId`, `createAccessibleIdFactory`, `mergeAccessibleIds`, `getAccessibleFieldIds`, `getAriaExpandedProps`, `getAriaDescriptionProps`, `getLandmarkProps`, `getLiveRegionProps`, `createScreenReaderText`, `createLiveRegionMessage` |
| `supports reduced motion and high contrast helpers` | `shouldReduceMotion` all 3 cases, `getReducedMotionTransition`, `getReducedMotionStyle`, `getHighContrastStyle`, `getHighContrastOutlineStyle`, `getVisuallyHiddenStyle`, `getSkipLinkStyle` |
| `validates accessible names, ARIA references, landmarks, and contrast` | `validateAccessibleName` fail/pass, `validateAriaReferences` missing, `validateLandmarkSemantics` fail/pass, `getContrastRatio`, `meetsContrast` |
| `keeps DS-001 through DS-006 compatibility visible through exports` | `Button`, `AppShell`, `DashboardShell`, `LoadingOverlay`, `Sparkline` |

**Coverage gaps (all NOTE or LOW):**
- `getAriaInvalidProps`, `getAriaPressedProps`, `getAriaBusyProps`, `getDisabledAriaProps` — not tested
- `createFocusTrap.focusLast()` — not tested
- `createFocusTrap.deactivate()` including `returnFocus=false` option — not tested
- `createFocusTrap` with `initialFocus` and `fallbackFocus` options — not tested
- `createFocusTrap.handleKeyDown` with `Shift+Tab` at first element — not tested (only Tab-at-last is covered)
- `getNextRovingFocusIndex` with `loop=false` — not tested
- `getNextRovingFocusIndex` with all items disabled — not tested
- `getRovingFocusItemProps` with `disabled=true` — not tested
- `getNextRovingFocusIndex` with `direction="first"` and `direction="last"` via key — not directly tested
- `validateAriaReferences` with all IDs matching (no issues) — only error case tested
- `Landmark` with different `as` elements (only "main" tested)
- `LiveRegion` with `visible=true` — not tested
- `meetsContrast` with `compliance="AAA"` or `largeText=true` — not tested
- `parseHexColor` error case (invalid hex) — not tested
- `getAriaDescriptionProps` with `invalid=false` — not tested

These gaps are NOTE-level — the tested paths cover the primary usage and critical branches. The untested branches are all well-typed and straightforward. Higher coverage would be ideal but is not a release blocker.

---

## Documentation Findings

**README** covers: scope list, package surface, compatibility statement. Very minimal — three sections.

**IMPLEMENTATION_REPORT** covers: files added/updated, implementation summary, expected validation commands, known limitations.

**Missing documentation (all LOW or NOTE):**

1. **No usage examples.** The README has no code examples for the most complex utilities: focus trap wiring (how to `activate/deactivate/handleKeyDown`), roving focus integration (how `getNextRovingFocusIndex` + `getRovingFocusItemProps` are combined), live region announce patterns, accessible field ID wiring.
2. **No WCAG intent statement.** The README does not clarify what DS-007 is and isn't: it is a utility layer for building accessible components, not a WCAG certification toolkit. A brief disclaimer would prevent overclaiming.
3. **No prior carry-forward disposition.** The README doesn't state which prior issues are now addressed (`getAccessibleFieldIds` resolves DS-002 form linking) and which remain deferred (DS-004/DS-005/DS-006 component patches). Release notes or carry-forward tracking table would help.
4. **No forced-colors / Windows High Contrast Mode documentation.** `getHighContrastStyle` is a JS-driven consumer toggle. It does NOT respond to `@media (forced-colors: active)`. Consumers need to know this — otherwise they may believe their app handles Windows HCM automatically.
5. **`createFocusTrap` controller pattern not explained.** No documentation that consumers must wire `handleKeyDown` to `onKeyDown` themselves. This is non-obvious to developers accustomed to "drop in a focus-trap" libraries.
6. **DS-008 relationship absent.** README says nothing about how DS-007 helpers relate to upcoming DS-008 Theme & Branding, particularly `getAccessibleFocusStyle` and focus token dependencies.

---

## Backward Compatibility Findings

DS-007 is fully backward-compatible with DS-001 through DS-006 and CAP-001 through CAP-008.

- All DS-002/DS-003/DS-004/DS-005/DS-006 exports intact: 51 prior tests pass alongside 9 new tests ✅
- DS-001 shared exports unchanged: 9 shared tests pass ✅
- Domain tests: 31 files / 285 tests pass ✅
- Application tests: 34 files / 211 tests pass ✅
- No runtime, governance, database, or business capability behavior modified ✅
- No export naming conflicts between DS-007 identifiers and DS-002 through DS-006 ✅

---

## Future Slice Readiness

| Slice | Readiness |
|---|---|
| DS-008 Theme & Branding | ✅ — `getAccessibleFocusStyle` and `getHighContrastOutlineStyle` consume `theme.state.focus.*` and `theme.color.*` tokens; DS-008 token rebasing will propagate through focus ring styles automatically. No hardcoded color values in accessibility styles. |
| DS-005 patch (Modal focus trap) | ✅ — `createFocusTrap` provides all primitives needed to wire a focus trap into Modal/Dialog |
| DS-005 patch (Dropdown roving focus) | ✅ — `getRovingFocusDirectionForKey` + `getNextRovingFocusIndex` + `getRovingFocusItemProps` provide all menu navigation primitives |
| DS-004/DS-005/DS-006 nested role=status patch | ✅ — `LiveRegion` component provides the correct pattern; replacing nested `role="status"` with `<LiveRegion>` is a straightforward patch |
| DS-002 form control ARIA wiring | ✅ — `getAccessibleFieldIds` + `getAriaDescriptionProps` + `getAriaLabelProps` provide everything needed |

---

## Issues Found

### BLOCKER

None.

### HIGH

None.

### MEDIUM

None.

### LOW

**L-001**  
**Location:** `packages/ui/src/accessibility/focus.ts:36–48`  
**Finding:** `isElementFocusable` does not exclude elements hidden via CSS (`display: none`, `visibility: hidden`). Elements without `aria-hidden="true"` that are visually hidden via CSS will pass the focusability check. In practice, browsers silently no-op `focus()` calls on `display: none` elements. However, elements with `visibility: hidden` can receive programmatic focus in some browser versions. If a focus trap container has `visibility: hidden` children that aren't `aria-hidden`, `getFocusableElements` returns them, `handleKeyDown` may attempt to focus them, and the trap may appear to "lose" focus.  
**Recommendation:** Document this limitation in the `createFocusTrap` JSDoc or README. Optionally add a `checkVisibility` filter using `element.checkVisibility?.()` (modern browsers) or a `getBoundingClientRect().width === 0` heuristic as an opt-in enhancement. Do not break existing behavior — treat as additive documentation and an optional future enhancement.

**L-002**  
**Location:** `packages/ui/src/accessibility/roving-focus.ts:118–132`  
**Finding:** `getRovingFocusItemProps` always includes `aria-selected: options.selected` in the return object. If a consumer passes `selected: false`, the element renders with `aria-selected="false"`. The `aria-selected` attribute is semantically appropriate only for selectable roles (`role="tab"`, `role="option"`, `role="row"`, `role="gridcell"`, `role="treeitem"`, `role="columnheader"`, `role="rowheader"`). On `role="menuitem"` (a valid roving focus target), `aria-selected="false"` triggers an invalid ARIA attribute warning in axe-core and Lighthouse because the role does not support `aria-selected`.  
**Recommendation:** Add documentation that `options.selected` should only be passed when the item's role supports `aria-selected`. Consider making `selected` a separate, role-specific prop or renaming it to `ariaSelected` to signal intentionality.

**L-003**  
**Location:** `packages/ui/src/accessibility/landmarks.tsx:23–39`  
**Finding:** `Landmark` with the default `roleName="region"` and no `label` or `labelledBy` prop renders `<section role="region">` without an accessible name. Per WAI-ARIA 1.2, a `region` landmark without an accessible name is not exposed as a landmark by NVDA+Firefox, VoiceOver+Safari, and other SR/browser combinations. Consumers who write `<Landmark as="section">Dashboard</Landmark>` (using the default `roleName`) will unknowingly create a silently bypassed landmark.  
**Recommendation:** Add a runtime dev-mode warning (or at minimum, documentation and a call to `validateLandmarkSemantics` in the README example) warning that `roleName="region"` requires a label or labelledBy to function as a landmark. Alternatively, default `roleName` to something other than "region" (e.g., not defaulting at all and requiring consumers to pass it explicitly).

**L-004**  
**Location:** `packages/ui/src/styles/component-styles.ts:20–30`  
**Finding:** `visuallyHiddenStyle` uses `clip: rect(0,0,0,0)`. The `clip` CSS property is deprecated in favor of `clip-path`. The modern screen-reader-only technique uses `clip-path: inset(50%)` with `overflow: hidden` and `white-space: nowrap`. The deprecated `clip` property is still supported in all current browsers as of 2026, so this is not a functional defect.  
**Recommendation:** Add `clipPath: "inset(50%)"` alongside the existing `clip` for forward compatibility. Leave `clip` in place for older browser support.

### NOTE

**N-001**  
**Location:** `packages/ui/src/accessibility/focus.ts:1–13`  
**Finding:** `focusableSelector` includes `[tabindex]` without value, which matches `tabindex="-1"` elements. These are queried then filtered out by `isElementFocusable`. Functionally correct; marginally inefficient for elements with `tabindex="-1"`. A more precise selector would use `[tabindex]:not([tabindex="-1"])`. Not worth changing unless performance in very large DOM trees is a concern.

**N-002**  
**Location:** `packages/ui/src/accessibility/ids.ts:19–26`  
**Finding:** `createAccessibleIdFactory(prefix)` uses a module-closure counter. If a factory is created at module level (a shared singleton imported across the app), the counter increments across all component instances and across SSR render passes. In SSR, server-rendered HTML may have different IDs than client-hydrated HTML if the factory is called a different number of times on server vs client (e.g., React Strict Mode double-invocation). For SSR-safe usage, consumers should create a factory per component instance (or use `React.useId()` for React components). Not documented in the README or JSDoc.

**N-003**  
**Location:** `packages/ui/src/accessibility/aria.ts:4–12` and `packages/ui/src/accessibility/landmarks.tsx:11–21`  
**Finding:** `getLandmarkProps` and `getAriaLabelProps` return objects containing `"aria-label": undefined` and `"aria-labelledby": undefined` when the options are not provided. In React, undefined props are not rendered, so this is harmless in JSX usage. However, if consumers use these functions imperatively (calling `element.setAttribute(...)` or spreading into a non-React context), they receive explicit undefined values and must handle them. Minor ergonomic gap.

**N-004**  
**Location:** `packages/ui/src/accessibility/aria.ts:14–23`  
**Finding:** `getAriaDescriptionProps` sets `aria-errormessage` when `invalid && errorId` but does NOT set `aria-invalid`. ARIA Authoring Practices specify that `aria-errormessage` is only announced when `aria-invalid` is not `false` or `undefined`. Consumers must also call `getAriaInvalidProps` (or set `aria-invalid` manually) for the error message to be surfaced. The functions are separate by design (separation of concerns), but the interaction is not documented. A consumer who only uses `getAriaDescriptionProps` with `invalid: true` and doesn't add `aria-invalid` will have a linked error message that is silently suppressed by screen readers.

**N-005**  
**Location:** `packages/ui/src/accessibility/landmarks.tsx:5–9` (`AccessibilityLandmarkRole` type)  
**Finding:** `AccessibilityLandmarkRole` covers all 8 ARIA landmark roles. The DS-004 carry-forward for `DashboardToolbar` and `DashboardFilterBar` requires `role="toolbar"` — a widget role, not a landmark. No DS-007 utility covers `toolbar` ARIA wiring. This is correct (toolbar is not a landmark), but the DS-004 carry-forward remains without a dedicated helper. Consumers must apply `role="toolbar"` and `aria-label` manually.

**N-006**  
**Location:** `docs/nextshift-os-3/design-system/slices/DS-007-accessibility/README.md`  
**Finding:** The README (3 sections, ~35 lines) does not contain: usage examples for focus trap, roving focus, or live region patterns; a WCAG intent disclaimer; a prior carry-forward disposition table; forced-colors limitations; or DS-008 relationship notes. This makes the slice harder to adopt correctly and creates uncertainty about what prior issues are now resolved versus deferred.

---

## Required Fixes Before Release

None. All findings are LOW or NOTE severity. No blockers, no HIGH/MEDIUM findings. The WCAG contrast math is correct. All utilities are correctly typed and safe. DS-001 through DS-006 compatibility is intact.

---

## Recommended Follow-ups

1. **(DS-007 docs patch)** Add a README section with wiring examples for `createFocusTrap` (attach `handleKeyDown` to `onKeyDown`), `createAccessibleIdFactory` (SSR caveat — create per instance, not at module level), and `getAccessibleFieldIds` (linking form field to label/error/description).
2. **(DS-007 docs patch)** Add WCAG intent statement: DS-007 provides utility primitives for building accessible patterns; it does not certify WCAG compliance.
3. **(DS-007 docs patch)** Add a forced-colors disclaimer: `getHighContrastStyle` is a consumer-controlled toggle; it does not respond to `@media (forced-colors: active)` / Windows High Contrast Mode.
4. **(DS-007 docs patch)** Add prior carry-forward disposition: which issues are now addressed (DS-002 form ARIA linking) and which component patches remain deferred.
5. **(DS-007 minor patch)** Add `clipPath: "inset(50%)"` to `visuallyHiddenStyle` — resolves L-004.
6. **(DS-007 minor patch)** Change `Landmark` default to require `roleName` explicitly, or add a dev-mode warning when `roleName="region"` is used without a label — resolves L-003.
7. **(DS-007 docs / JSDoc)** Document `getRovingFocusItemProps.selected` — only pass for selectable roles — resolves L-002.
8. **(DS-007 JSDoc)** Document `isElementFocusable` CSS-hidden limitation — resolves L-001.
9. **(DS-005 patch)** Wire `createFocusTrap` into `Modal` and `Dialog` components — addresses DS-005 H-001 carry-forward.
10. **(DS-005 patch)** Wire `getNextRovingFocusIndex` + `getRovingFocusItemProps` into `Dropdown` — addresses DS-005 Dropdown roving focus carry-forward.
11. **(DS-004/DS-005/DS-006 patch)** Replace nested `role="status"` in `DashboardLoadingState`, `LoadingOverlay`, and `VisualizationLoadingState` with `<LiveRegion>` component.
12. **(DS-002 patch)** Use `getAccessibleFieldIds` in `Input`, `Textarea`, `Select` components to link labels, helper text, and error text via `aria-labelledby` / `aria-describedby`.

---

## Final Recommendation

**DS-007 Accessibility is production-ready. Proceed to Verification and Release.**

The implementation correctly establishes the reusable accessibility foundation for `@nextshift/ui`. The controller-pattern for focus management is the right architectural choice. The WCAG contrast math is correct. The roving focus and ID utilities are composable and safe. The validation utilities are appropriately scoped — they provide utility-level checks without overclaiming WCAG certification. All tests pass, all typechecks pass, and all prior-slice exports are intact. The LOW and NOTE findings are documentation and ergonomic improvements that can be addressed in post-release patches without blocking adoption.
