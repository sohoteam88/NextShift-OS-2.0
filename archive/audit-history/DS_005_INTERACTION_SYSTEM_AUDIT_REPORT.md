# DS-005 Interaction System Audit Report

**Audit Type:** Independent Code + Architecture Audit  
**Auditor:** Claude Code (Independent Architecture Auditor)  
**Date:** 2026-06-29  
**Project:** NextShift OS 3.1 / NextShift Design System v1.0  
**Slice:** DS-005 Interaction System

---

## Audit Result

**CONDITIONAL PASS**

---

## Executive Summary

DS-005 Interaction System is a structurally sound, correctly scoped, well-typed, and largely token-driven extension to `@nextshift/ui`. All thirteen required primitives and utilities are present and exported. Token consumption is strong across motion, state, z-index, elevation, color, and typography. DS-002/DS-003/DS-004 compatibility is intact. All 42 unit tests pass with zero typecheck errors across all packages. Two HIGH accessibility defects require fixes before the interaction layer is safe to ship: (1) `Dropdown` places `aria-expanded` and `aria-haspopup="menu"` on a wrapping `<div>` rather than on the trigger control element — these attributes have no effect on the trigger's interactive semantics for screen readers; and (2) `Tooltip` hardcodes `id="nextshift-tooltip"` — multiple tooltip instances on the same page produce duplicate IDs, breaking HTML validity and `aria-describedby` linkage. Two MEDIUM findings cover a missing `aria-labelledby` on Modal/Dialog and two hardcoded rgba overlay colors that will not respond to DS-008 theme changes. These four items require resolution; the LOW and NOTE findings are forward-looking.

---

## Files Inspected

```
packages/ui/src/interaction/index.ts
packages/ui/src/interaction/loading-overlay.tsx
packages/ui/src/interaction/progress-indicator.tsx
packages/ui/src/interaction/toast.tsx
packages/ui/src/interaction/modal.tsx
packages/ui/src/interaction/dialog.tsx
packages/ui/src/interaction/dropdown.tsx
packages/ui/src/interaction/tooltip.tsx
packages/ui/src/interaction/focus-ring.ts
packages/ui/src/interaction/motion.ts
packages/ui/src/interaction/state.ts
packages/ui/src/interaction/keyboard.ts
packages/ui/src/interaction/hooks.ts
packages/ui/src/styles/interaction-styles.ts
packages/ui/src/types/interaction-types.ts
packages/ui/src/index.ts
packages/ui/src/styles/index.ts
packages/ui/src/types/index.ts
packages/ui/test/interaction-system.test.tsx
packages/ui/test/dashboard-framework.test.tsx
packages/ui/test/layout-system.test.tsx
packages/ui/test/component-library.test.tsx
packages/shared/src/design-system/tokens/theme-tokens.ts
packages/shared/src/design-system/tokens/semantic-tokens.ts
docs/nextshift-os-3/design-system/slices/DS-005-interaction-system/README.md
docs/nextshift-os-3/design-system/slices/DS-005-interaction-system/IMPLEMENTATION_REPORT.md
```

---

## Commands Executed

| Command | Result |
|---|---|
| `pnpm --filter @nextshift/ui test` | ✅ PASS — 4 files / 42 tests |
| `pnpm --filter @nextshift/ui typecheck` | ✅ PASS — 0 errors |
| `pnpm --filter @nextshift/shared test` | ✅ PASS — 1 file / 9 tests |
| `pnpm --filter @nextshift/shared typecheck` | ✅ PASS — 0 errors |
| `pnpm --filter @nextshift/domain test` | ✅ PASS — 31 files / 285 tests |
| `pnpm --filter @nextshift/domain typecheck` | ✅ PASS — 0 errors |
| `pnpm --filter @nextshift/application test` | ✅ PASS — 34 files / 211 tests |
| `pnpm --filter @nextshift/application typecheck` | ✅ PASS — 0 errors |

---

## Scope Boundary Findings

DS-005 stayed within scope. No violations found.

Confirmed absent: runtime redesign, governance changes, database changes, backend APIs, global notification service, external state manager, authentication/authorization changes, business capability changes, routing, route-aware navigation, data fetching, state persistence, charts, theme switcher UI, new UI framework dependencies, unrelated refactors. No new packages or workspace dependencies were introduced.

DS-005 correctly avoids global state: `useDisclosure` is local `React.useState`, `useKeyboardActivation` creates a stable `React.useCallback` handler, keyboard utilities are pure functions, and state utilities are stateless helpers.

---

## Package Extension Findings

DS-005 correctly extends `@nextshift/ui` without creating a second package or adding dependencies:

- New `packages/ui/src/interaction/` directory — 13 files (7 components + 5 utility files + barrel) ✅
- New `packages/ui/src/styles/interaction-styles.ts` ✅
- New `packages/ui/src/types/interaction-types.ts` ✅
- `packages/ui/src/index.ts` updated with `export * from "./interaction"` — additive only ✅
- `packages/ui/src/styles/index.ts` updated with 12 interaction style function exports — additive only ✅
- `packages/ui/src/types/index.ts` updated with 8 interaction type exports — additive only ✅
- `packages/ui/package.json`, `tsconfig.json`, `vitest.config.ts` unchanged ✅

All DS-002, DS-003, and DS-004 exports remain intact. The extension pattern is identical to DS-003 and DS-004.

---

## Interaction Primitive Coverage Findings

All thirteen required primitives and utilities are implemented and exported:

| Primitive / Utility | File | Exported From | Notes |
|---|---|---|---|
| LoadingOverlay | `loading-overlay.tsx` | interaction barrel + `@nextshift/ui` | Composes DS-002 `Spinner` |
| ProgressIndicator | `progress-indicator.tsx` | interaction barrel + `@nextshift/ui` | Inline progressbar |
| Toast | `toast.tsx` | interaction barrel + `@nextshift/ui` | Composes DS-002 `Button` |
| Modal | `modal.tsx` | interaction barrel + `@nextshift/ui` | Composes DS-002 `Button` |
| Dialog | `dialog.tsx` | interaction barrel + `@nextshift/ui` | Thin wrapper over Modal |
| Dropdown | `dropdown.tsx` | interaction barrel + `@nextshift/ui` | Structural; no roving focus |
| Tooltip | `tooltip.tsx` | interaction barrel + `@nextshift/ui` | Controlled open/close |
| getFocusRingStyle | `focus-ring.ts` | interaction barrel + styles barrel | Re-exports from `interaction-styles.ts` |
| getMotionTransition | `motion.ts` | interaction barrel + styles barrel | Re-exports from `interaction-styles.ts` |
| getInteractionStateAttributes / isInteractionBlocked | `state.ts` | interaction barrel + `@nextshift/ui` | Pure functions |
| getKeyboardIntent / isActivationKey / shouldHandleEscape / callOnKeyboardIntent | `keyboard.ts` | interaction barrel + `@nextshift/ui` | Pure functions |
| useDisclosure | `hooks.ts` | interaction barrel + `@nextshift/ui` | Local state only |
| useKeyboardActivation | `hooks.ts` | interaction barrel + `@nextshift/ui` | Stable callback |

All primitives are reusable, typed, minimal, and not business-specific.

---

## Token Consumption Findings

`interaction-styles.ts` imports `nextShiftThemeTokens` from `@nextshift/shared` and consumes across all required categories:

| Token Category | Used | Examples |
|---|---|---|
| Semantic colors | ✅ | `color.foreground/success/warning/danger/info/surface/surfaceMuted/border` |
| State opacity | ✅ | `state.disabled.opacity`, `state.selected.opacity` |
| Focus state | ✅ | `state.focus.outlineOffset`, `state.focus.outlineWidth` |
| Motion | ✅ | `motion.duration.fast/normal/slow`, `motion.easing.standard` |
| Z-index | ✅ | `zIndex.overlay`, `zIndex.modal`, `zIndex.dropdown`, `zIndex.tooltip` |
| Elevation | ✅ | `elevation.lg`, `elevation.xl` |
| Radius | ✅ | `radius.full`, `radius.lg`, `radius.md`, `radius.sm` |
| Spacing | ✅ | `spacing["1"]`, `spacing["2"]`, `spacing["3"]`, `spacing["4"]`, `spacing["6"]` |
| Typography | ✅ | `typography.fontSize.xs`, `typography.lineHeight.normal` |
| Breakpoints (modal widths) | ✅ | `breakpoint.xs/sm/md/lg` — consumed as modal max-width values |
| Chart tooltip tokens | ⚠️ | `chart.tooltip.background/border/foreground` — see Issues L-003 |

**Token gaps (see Issues M-004, L-002):**

- `getLoadingOverlayStyle`: `background: "rgba(255, 255, 255, 0.82)"` — hardcoded semi-transparent white. No overlay background token in DS-001.
- `getModalBackdropStyle`: `background: "rgba(17, 24, 39, 0.48)"` — hardcoded scrim color. No scrim token in DS-001.
- `getInteractionSpinnerStyle`: `spinnerSize` map uses `"1rem"`, `"1.25rem"`, `"2rem"` instead of spacing tokens (`spacing["4"]`, `spacing["5"]`, `spacing["8"]`).

All other style properties are token-derived. `maxWidth: "24rem"` in `getToastStyle` and `minWidth: "12rem"` in `getDropdownStyle` are structural layout constraints with no token equivalent — acceptable.

---

## DS-002 / DS-003 / DS-004 Compatibility Findings

DS-005 composes prior-slice primitives without duplicating them and without creating export conflicts:

- `Button` (DS-002) — composed in `Modal` (close button), `Toast` (dismiss button) ✅
- `Spinner` (DS-002) — composed in `LoadingOverlay` ✅
- DS-003 layout exports intact ✅
- DS-004 dashboard exports intact ✅
- All 33 prior DS-002/DS-003/DS-004 tests pass ✅
- Backward compat test (test 8 of 8 in DS-005 suite) verifies `Button` (DS-002), `AppShell` (DS-003), `DashboardShell` (DS-004) all importable and renderable ✅
- No export name conflicts — DS-005 symbol names (`LoadingOverlay`, `Modal`, `Dialog`, `Dropdown`, `Tooltip`, `Toast`, `ProgressIndicator`, `useDisclosure`, `useKeyboardActivation`, etc.) are distinct from all prior DS exports ✅

TypeScript typecheck confirms zero conflicts across all packages ✅.

---

## Public API Findings

`packages/ui/src/index.ts` exposes all DS-005 content via `export * from "./interaction"` (components, utilities, hooks, prop types) and `export * from "./styles"` (style functions). The public surface adds:

- **Components**: `LoadingOverlay`, `ProgressIndicator`, `Toast`, `Modal`, `Dialog`, `Dropdown`, `Tooltip` ✅
- **Prop types**: `LoadingOverlayProps`, `ProgressIndicatorProps`, `ToastProps`, `ModalProps`, `DialogProps`, `DropdownProps`, `TooltipProps`, `DisclosureControls` ✅
- **Hooks**: `useDisclosure`, `useKeyboardActivation` ✅
- **Keyboard utilities**: `getKeyboardIntent`, `isActivationKey`, `shouldHandleEscape`, `callOnKeyboardIntent` ✅
- **State utilities**: `getInteractionStateAttributes`, `isInteractionBlocked` ✅
- **Style functions**: `getFocusRingStyle`, `getMotionTransition`, `getInteractionStateStyle`, `getLoadingOverlayStyle`, `getModalBackdropStyle`, `getModalSurfaceStyle`, `getProgressBarStyle`, `getProgressTrackStyle`, `getToastStyle`, `getDropdownStyle`, `getTooltipStyle`, `getInteractionSpinnerStyle` ✅
- **Types**: `InteractionTone`, `InteractionSize`, `ProgressMode`, `OverlayPlacement`, `DropdownAlign`, `ModalSize`, `KeyboardIntent`, `InteractionState` ✅

**Minor asymmetry (NOTE-level):** `getInteractionStateStyle` is exported from the styles barrel (`styles/index.ts`) and therefore from `@nextshift/ui`, but is NOT re-exported from the interaction barrel (`interaction/index.ts`). `getInteractionStateAttributes` and `isInteractionBlocked` from `state.ts` ARE exported from both barrels. The asymmetry is minor (the function is still publicly accessible) but inconsistent with the pattern.

Internal utilities (`spinnerSize`, `toneColor`, `modalWidth`) are correctly file-private ✅.

Consumer import `import { Modal, Toast, useDisclosure, getFocusRingStyle, getMotionTransition } from "@nextshift/ui"` works as expected ✅.

---

## Prop Typing Findings

All interaction types are explicit literal unions or well-constrained interfaces:

| Type | Value | Notes |
|---|---|---|
| `InteractionTone` | `"neutral" \| "success" \| "warning" \| "danger" \| "info"` | Clean semantic union |
| `InteractionSize` | `"sm" \| "md" \| "lg"` | Duplicates DS-002 `ComponentSize` — see N-001 |
| `ProgressMode` | `"determinate" \| "indeterminate"` | Clean |
| `OverlayPlacement` | `"center" \| "top" \| "bottom"` | Clean |
| `DropdownAlign` | `"start" \| "center" \| "end"` | Clean |
| `ModalSize` | `"sm" \| "md" \| "lg" \| "xl"` | 4-point scale |
| `KeyboardIntent` | `"activate" \| "cancel" \| "navigate-next" \| "navigate-previous"` | Clean |
| `InteractionState` | Interface with 5 optional boolean flags | All readonly optional ✅ |

**ModalProps**: `extends Omit<React.HTMLAttributes<HTMLDivElement>, "title">` — correct collision avoidance for `HTMLElement.title` ✅. No `aria-label` prop for the case where `title` is absent — see Issues M-001.

**DialogProps**: `extends Omit<ModalProps, "role">` — removes the `role` prop from the public surface, preventing consumers from accidentally overriding `role="dialog"`. Clean intentional restriction ✅.

**Dropdown**: No `aria-label` prop for the trigger wrapper — see Issues H-002 (renamed to M-002 in severity scale). The ARIA attributes (`aria-expanded`, `aria-haspopup`) are applied to a wrapper `<div>`, not to the trigger element, which is addressed in H-002 (ARIA misplacement, not a prop typing concern per se).

**TooltipProps**: No `id` prop for consumers to supply their own unique ID — hardcoded `id="nextshift-tooltip"` causes duplicate ID issue. See Issues H-003 (renamed M-003).

**ProgressIndicatorProps**: `Omit<React.HTMLAttributes<HTMLDivElement>, "children">` — correctly prevents children from being passed to a progressbar ✅.

All props support `className`, `style`, and spread native element props ✅.

No ref forwarding on DS-005 primitives — consistent with DS-002/DS-003/DS-004 pattern ✅.

---

## Hook and Utility Findings

**`useDisclosure`:**
- Uses `React.useState(defaultOpen)` — local component state only ✅
- No global store, localStorage, sessionStorage, event emitter, or side effects ✅
- `show`, `hide`, `toggle` are memoized with `React.useCallback` ✅
- Returns `DisclosureControls` interface — typed and stable ✅
- `defaultOpen` parameter: enables SSR-safe initialization ✅

**`useKeyboardActivation(callback)`:**
- Wraps `callOnKeyboardIntent(event, "activate", callback)` in `React.useCallback([callback])` ✅
- Stable handler reference when callback is memoized by the caller ✅
- No global event listener registered (event handler is returned for consumer to attach) ✅
- No cleanup needed — no side effects introduced ✅

**Keyboard utilities (`keyboard.ts`):**
- All pure functions, no React, no DOM globals, fully deterministic ✅
- `getKeyboardIntent`: maps `Enter`, `" "` (Space), `Escape`, arrow keys correctly ✅
- `isActivationKey` / `shouldHandleEscape`: simple intent-equality wrappers ✅
- `callOnKeyboardIntent`: calls `event.preventDefault()` only when intent matches — correct; does not swallow unrelated events ✅
- `Tab` intentionally unmapped — browser handles Tab focus navigation natively ✅
- `Home`/`End` keys unmapped — appropriate omission for baseline layer; roving focus navigation deferred to DS-007 ✅

**State utilities (`state.ts`):**
- `getInteractionStateAttributes`: returns clean `React.AriaAttributes & data-*` map. Uses `|| undefined` to omit false-y ARIA attributes from the DOM ✅
- `isInteractionBlocked`: simple boolean check, no side effects ✅
- No hidden global store or persistence ✅

---

## Accessibility Findings

**LoadingOverlay**: `role="status"` ✅, `aria-label={label}` ✅. Composes DS-002 `Spinner`, which also renders `role="status"` — nested live regions. Outer container role is sufficient; inner Spinner should receive `aria-hidden="true"`. See Issues L-001.

**ProgressIndicator**: `role="progressbar"` ✅, `aria-label={label}` ✅. `aria-valuemin/valuemax/valuenow` set in determinate mode, omitted in indeterminate (ARIA spec-compliant) ✅. Clean and correct.

**Toast**: `role={tone === "danger" ? "alert" : "status"}` ✅ — `role="alert"` for assertive danger announcements, `role="status"` for polite neutral/success/warning/info. Semantically correct and tested ✅.

**Modal**:
- `role="dialog"` ✅, `aria-modal="true"` ✅
- **Missing `aria-labelledby`**: The dialog surface `<div role="dialog">` has no accessible name. When `title` is provided, a `<h2>` is rendered inside, but the dialog element has no `aria-labelledby` attribute pointing to it. ARIA spec requires dialogs to have an accessible name via `aria-labelledby` (preferred when a visible heading exists) or `aria-label`. Screen readers announce the dialog as "dialog" with no name, losing context for the user. When `title` is absent, there is also no `aria-label` fallback. See Issues M-001.
- No `aria-labelledby` means the static `<h2>` inside the dialog is invisible to screen readers as the dialog's name.
- Focus trap not implemented — documented limitation, accepted per audit rules ✅.
- Modal header uses hardcoded inline style `{ alignItems: "center", display: "flex", justifyContent: "space-between" }` — minor (same class of concern as DS-003 L-001).

**Dialog**: Inherits all Modal accessibility characteristics ✅.

**Dropdown**:
- `role="menu"` on open menu ✅, `aria-label={menuLabel}` on menu ✅
- `aria-haspopup="menu"` and `aria-expanded={open}` are applied to a **wrapping `<div>`**, not to the trigger control. The trigger (`{trigger}` prop) is an arbitrary `ReactNode` inside that `<div>`. Assistive technology expects `aria-haspopup` and `aria-expanded` directly on the interactive element (typically a `<button>`) that activates the popup. A `<div>` is not an interactive element, so these attributes have no semantic effect on the trigger's announced state. When a user activates the trigger button (which lacks these attributes), screen readers do not announce that a menu is available or whether it is expanded. See Issues H-001.
- No roving focus — documented limitation, accepted per audit rules ✅.

**Tooltip**:
- `role="tooltip"` ✅ when open
- `aria-describedby={open ? "nextshift-tooltip" : undefined}` applied to the children wrapper ✅ when open
- `id="nextshift-tooltip"` hardcoded on the tooltip element. If two or more `Tooltip` components are rendered open simultaneously (or sequentially without unmounting), the DOM contains duplicate `id="nextshift-tooltip"` elements — invalid HTML. `aria-describedby` will reference the first matching element in the DOM, causing all tooltips after the first to announce the wrong content to screen readers. See Issues H-002.

**Focus ring**: `getFocusRingStyle` returns outline properties using DS-001 focus tokens ✅. No `outline: none` or focus ring removal anywhere in `interaction-styles.ts` ✅.

**Keyboard utilities**: Enter/Space = activate ✅, Escape = cancel ✅, Arrow keys = navigate ✅. `callOnKeyboardIntent` calls `event.preventDefault()` when handling — prevents double-firing on Space for buttons ✅.

**ProgressIndicator**: `aria-valuetext` not supported — minor gap; `aria-label` provides sufficient context for most cases. Deferred to DS-007 ✅.

---

## Styling Strategy Findings

Interaction style contracts are predominantly token-driven. All z-index values, motion durations/easings, state opacities, semantic colors, focus ring values, elevation, radius, typography, and spacing are consumed from DS-001 `nextShiftThemeTokens`. No external UI framework introduced ✅. Styling does not block DS-008 Theme & Branding.

**Two hardcoded rgba colors (see Issues M-004):**

| Location | Value | Concern |
|---|---|---|
| `getLoadingOverlayStyle` | `background: "rgba(255, 255, 255, 0.82)"` | Semi-transparent white; will not update in dark theme |
| `getModalBackdropStyle` | `background: "rgba(17, 24, 39, 0.48)"` | Semi-transparent near-black scrim; same issue |

Both values are reasonable for the light theme but are hardcoded and lack DS-001 token equivalents. DS-001 has no overlay/scrim tokens. Adding `overlayBackground` and `scrimBackground` tokens to DS-001 (or consuming a future `semanticTokens.overlay.*` group) is the correct resolution.

**`getTooltipStyle` uses `theme.chart.tooltip.*` tokens** — `chart.tooltip.background`, `chart.tooltip.border`, `chart.tooltip.foreground`. This reuses the chart token namespace for a UI primitive, creating semantic coupling between the tooltip component and chart styling. If chart tooltip colors are changed for charting purposes in DS-008, the UI tooltip will change too. See Issues L-003.

**`getProgressBarStyle` indeterminate value**: `transform: "scaleX(0.38)"` — the 0.38 factor is a common "indeterminate progress fill" convention with no token equivalent. Structural constant; acceptable. The transition uses `getMotionTransition(["transform"], "normal")` correctly ✅.

**Position strategy**: `LoadingOverlay` uses `position: "absolute"` — requires consumer to set `position: "relative"` on the containing element. This is correct for a content-area overlay and is documented in DS-005 README ✅.

---

## Test Coverage Findings

8 tests in `interaction-system.test.tsx`, all passing:

| Test | Coverage |
|---|---|
| `exposes public interaction components, helpers, and types` | All 7 components + type assignments |
| `renders loading overlay and progress indicator` | role, aria-label, aria-valuenow |
| `renders toast with status semantics` | role="status", role="alert", tone routing |
| `renders modal and dialog contracts` | role="dialog", aria-modal, data-dialog-tone |
| `renders dropdown and tooltip` | aria-haspopup, role="menu", role="tooltip", aria-describedby |
| `resolves keyboard interactions` | 7 key intent assertions |
| `provides interaction state helpers` | isInteractionBlocked, getInteractionStateAttributes, getInteractionStateStyle |
| `uses DS-001 tokens in interaction style contracts` | 3 token value assertions (focus, motion, progress) |
| `keeps DS-001 through DS-004 compatibility visible through exports` | Button, AppShell, DashboardShell importable and renderable |

Combined with 9 DS-004, 14 DS-003, and 10 DS-002 tests, total coverage is 42 tests across 4 files.

**Coverage gaps:**
- `LoadingOverlay` with `visible={false}` (returns null — no structural test) — NOTE
- `ProgressIndicator` indeterminate mode rendering — NOTE
- `ProgressIndicator` with `value > max` and `value < 0` edge cases — NOTE
- `Modal` with `open={false}` (returns null — no structural test) — NOTE
- `Modal` without `title` and without `onClose` (no header rendered) — NOTE
- `Modal` without `footer` — NOTE
- `Dropdown` with `open={false}` (menu not rendered — no assertion) — NOTE
- `Tooltip` with `open={false}` (tooltip not rendered — no assertion) — NOTE
- `Toast` without `title`/`description` (children-only path) — NOTE
- `callOnKeyboardIntent` callback invocation test — NOTE
- `useDisclosure` and `useKeyboardActivation` hook tests — NOTE (hooks are untested; test suite uses `renderToStaticMarkup` which cannot trigger useState updates)
- Token assertions for modal, toast, overlay styles — NOTE (test 7 covers focus, motion, progress; modal/toast/overlay tokens not asserted)
- Hardcoded rgba values in overlay/backdrop style not tested — NOTE

None of these gaps are blockers for the infrastructure layer, but `useDisclosure` and `useKeyboardActivation` have no test coverage at all.

---

## Documentation Findings

**DS-005 README** covers: purpose, complete primitive and utility list, token model, composition model, accessibility baseline, non-goals (focus trap, global toast manager, roving focus, persistence, routing, backend APIs, business logic), and an example usage showing `useDisclosure` + `Modal` + `Toast`. Clear and complete.

**DS-005 IMPLEMENTATION_REPORT** covers: scope, architecture decision, files created/modified, test results, typecheck results, and known limitations. Complete.

**Minor documentation gaps (NOTE-level):**
- README does not document that `LoadingOverlay` requires `position: "relative"` on the containing element
- README does not warn about the hardcoded tooltip ID limitation for multiple simultaneous tooltips
- README does not warn about `aria-expanded`/`aria-haspopup` ARIA placement limitation in `Dropdown`
- README does not document that `Modal`/`Dialog` have no `aria-labelledby` linking to the title heading
- README does not document `callOnKeyboardIntent`'s behavior of calling `event.preventDefault()`
- README does not document that `useKeyboardActivation` requires a memoized callback to be stable

---

## Backward Compatibility Findings

DS-005 is fully backward-compatible with DS-001 through DS-004 and CAP-001 through CAP-008.

- All DS-002/DS-003/DS-004 exports intact: 33 prior tests pass ✅
- DS-001 exports unchanged: 9 shared tests pass ✅
- Domain tests: 31 files / 285 tests pass ✅
- Application tests: 34 files / 211 tests pass ✅
- No runtime, governance, database, or business capability behavior modified ✅

---

## Future Slice Readiness

| Slice | Readiness |
|---|---|
| DS-006 Data Visualization | ✅ — `getMotionTransition` is available for chart animation; `ProgressIndicator` can serve as chart loading state |
| DS-007 Accessibility | ⚠️ — Three items need DS-007 work: (1) `Dropdown` ARIA misplacement (or redesign to cloneElement pattern); (2) `Tooltip` unique ID generation; (3) `Modal`/`Dialog` `aria-labelledby`; (4) `Modal`/`Dialog` focus trap |
| DS-008 Theme & Branding | ⚠️ — Two hardcoded rgba values in overlay/backdrop will not respond to theme changes; requires DS-001 token additions |

---

## Issues Found

### BLOCKER

None.

### HIGH

**H-001**  
**Location:** `packages/ui/src/interaction/dropdown.tsx:30`  
**Finding:** `aria-expanded={open}` and `aria-haspopup="menu"` are applied to a wrapping `<div>` container, not to the trigger element inside it:
```tsx
<div aria-expanded={open} aria-haspopup="menu">
  {trigger}  {/* arbitrary ReactNode — typically a Button */}
</div>
```
A `<div>` is not an interactive element. ARIA authoring practice requires `aria-haspopup` and `aria-expanded` to appear on the control that activates the popup — typically the `<button>` inside. As implemented, when a user activates the trigger button, screen readers do not announce that a menu is available, and do not announce the expanded/collapsed state change. The ARIA attributes are present in the DOM but have no semantic effect on the trigger.  
**Recommendation (Option A):** Use `React.cloneElement` to inject `aria-expanded` and `aria-haspopup` directly onto the trigger element:
```tsx
const triggerWithAria = React.isValidElement(trigger)
  ? React.cloneElement(trigger as React.ReactElement<React.HTMLAttributes<HTMLElement>>, {
      "aria-expanded": open,
      "aria-haspopup": "menu",
    })
  : trigger;
```
**Recommendation (Option B):** Document that consumers must set `aria-expanded` and `aria-haspopup` on the trigger element themselves, and remove them from the wrapper div. Option A is preferred as it makes the correct pattern automatic.

**H-002**  
**Location:** `packages/ui/src/interaction/tooltip.tsx:27–30`  
**Finding:** `id="nextshift-tooltip"` is hardcoded on every rendered `Tooltip` instance:
```tsx
<span id="nextshift-tooltip" role="tooltip" ...>
  {content}
</span>
```
When two or more `Tooltip` components with `open={true}` are present in the DOM simultaneously (e.g., adjacent hover-triggered tooltips, or a controlled multi-tooltip layout), every one renders `id="nextshift-tooltip"`. Duplicate `id` values violate HTML validity. `aria-describedby="nextshift-tooltip"` on each tooltip's children wrapper will resolve to the first matching element in the DOM, causing all but the first tooltip to describe the wrong content to screen readers.  
**Recommendation:** Generate a unique ID per instance using React 18's `useId()` hook:
```tsx
const tooltipId = React.useId();
// ...
<span aria-describedby={open ? tooltipId : undefined}>{children}</span>
{open ? <span id={tooltipId} role="tooltip" ...>{content}</span> : null}
```
For React 17 compatibility, a ref-based counter (`useRef(++globalCount)`) is an acceptable alternative.

### MEDIUM

**M-001**  
**Location:** `packages/ui/src/interaction/modal.tsx:46–49`  
**Finding:** `<div role="dialog" aria-modal="true" ...>` has no `aria-labelledby` or `aria-label`. When `title` is provided, a `<h2>` is rendered inside the dialog surface, but the dialog element has no attribute linking it to that heading. The ARIA dialog pattern requires an accessible name on the dialog container. Screen readers announce "dialog" with no name, leaving users without context about which dialog has appeared. When `title` is absent (no visible heading), the dialog has no accessible name at all.  
**Recommendation:** Assign a stable heading ID when `title` is provided, and link the dialog to it:
```tsx
const headingId = React.useId();
// ...
<div role="dialog" aria-modal="true" aria-labelledby={title ? headingId : undefined} aria-label={!title ? "Dialog" : undefined} ...>
  {title ? <h2 id={headingId} ...>{title}</h2> : null}
```
Also add an `aria-label` prop to `ModalProps` to allow consumers to name the dialog when no visible title is rendered.

**M-002**  
**Location:** `packages/ui/src/styles/interaction-styles.ts:88` + `packages/ui/src/styles/interaction-styles.ts:148`  
**Finding:** Two overlay background values are hardcoded rgba literals:
- `getLoadingOverlayStyle`: `background: "rgba(255, 255, 255, 0.82)"` — semi-transparent white
- `getModalBackdropStyle`: `background: "rgba(17, 24, 39, 0.48)"` — semi-transparent near-black scrim

DS-001 has no overlay or scrim tokens. These values will not respond to DS-008 theme changes and will break in a dark theme variant (the loading overlay would remain white against a dark background; the scrim would remain dark against a dark background surface, losing contrast).  
**Recommendation:** Add `semanticTokens.overlay.background` (e.g., `rgba(255, 255, 255, 0.82)`) and `semanticTokens.overlay.scrim` (e.g., `rgba(17, 24, 39, 0.48)`) to DS-001 as part of the DS-008 prep, then consume them here. This is a DS-001 patch item, but should be tracked against DS-005 as a dependent.

### LOW

**L-001**  
**Location:** `packages/ui/src/interaction/loading-overlay.tsx:40–44`  
**Finding:** `LoadingOverlay` renders `<div role="status" aria-label={label}>` as the outer container, then renders a `<Spinner>` inside it. `Spinner` (DS-002) renders `<span role="status">`. This produces nested live regions — the same pattern flagged in DS-004's DashboardLoadingState (DS-004 L-001). Screen readers may announce the loading label twice.  
**Recommendation:** Pass `aria-hidden="true"` to `Spinner` inside `LoadingOverlay`:
```tsx
<Spinner size={size} label={label} style={getInteractionSpinnerStyle(size, tone)} aria-hidden />
```
The outer `<div role="status" aria-label={label}>` is the authoritative live region announcement.

**L-002**  
**Location:** `packages/ui/src/styles/interaction-styles.ts:31–34`  
**Finding:** `getInteractionSpinnerStyle` uses a hardcoded size map:
```ts
const spinnerSize: Record<InteractionSize, string> = {
  sm: "1rem",
  md: "1.25rem",
  lg: "2rem",
};
```
Equivalent spacing tokens exist: `spacing["4"] = 1rem`, `spacing["5"] = 1.25rem`, `spacing["8"] = 2rem`. Using tokens ensures spinner sizes update automatically if the base spacing scale changes.  
**Recommendation:** Replace with `theme.spacing["4"]`, `theme.spacing["5"]`, `theme.spacing["8"]` respectively. Verify token values match before substituting.

**L-003**  
**Location:** `packages/ui/src/styles/interaction-styles.ts:197–208`  
**Finding:** `getTooltipStyle` consumes `theme.chart.tooltip.background`, `theme.chart.tooltip.border`, `theme.chart.tooltip.foreground` — the chart token namespace — for a UI-layer tooltip primitive. This creates semantic coupling: if chart tooltip colors are adjusted for data visualization purposes in DS-006 or DS-008, the UI tooltip will inherit those changes unintentionally. The tooltip UI component and chart tooltip surface serve different purposes and should not share tokens.  
**Recommendation:** Add dedicated tooltip tokens to DS-001 semantic layer (e.g., `semanticTokens.tooltip.*`) derived from surface/foreground/border semantic tokens. Consume them in `getTooltipStyle`. Alternatively, source from `theme.color.surface`, `theme.color.border`, and `theme.color.foreground` directly until dedicated tooltip tokens are introduced.

### NOTE

**N-001**  
**Location:** `packages/ui/src/types/interaction-types.ts:7`  
**Finding:** `InteractionSize = "sm" | "md" | "lg"` is identical to DS-002's `ComponentSize`. Same type duplication as DS-004 N-003 (`DashboardGridColumns` vs `GridColumns`).  
**Recommendation:** Re-export `ComponentSize` from DS-002 as `InteractionSize`, or use `ComponentSize` directly in interaction prop types. Eliminates duplication without changing the public API shape.

**N-002**  
**Location:** `packages/ui/src/interaction/focus-ring.ts` + `packages/ui/src/interaction/motion.ts`  
**Finding:** Both files are single-line re-export wrappers for functions already in `styles/interaction-styles.ts`. This adds 2 files of indirection without material benefit — `getFocusRingStyle` and `getMotionTransition` are already exported from `interaction/index.ts` and `styles/index.ts`.  
**Recommendation:** Export `getFocusRingStyle` and `getMotionTransition` directly from `interaction/index.ts` (with `export { getFocusRingStyle } from "../styles"`) and delete `focus-ring.ts` and `motion.ts`. Minor cleanup; low urgency.

**N-003**  
**Location:** `packages/ui/src/styles/index.ts`  
**Finding:** `getInteractionStateStyle` is exported from the styles barrel but NOT from `interaction/index.ts`. `getInteractionStateAttributes` and `isInteractionBlocked` (from `state.ts`) ARE exported from the interaction barrel. The asymmetry is minor since all are accessible via `@nextshift/ui`, but inconsistent within the interaction module's own barrel.  
**Recommendation:** Add `export { getInteractionStateStyle } from "../styles/interaction-styles"` to `interaction/index.ts`, or re-export through `state.ts`.

**N-004**  
**Location:** `packages/ui/src/interaction/tooltip.tsx` (general pattern)  
**Finding:** `ProgressIndicator` has no `aria-valuetext` prop for providing human-readable progress descriptions (e.g., "3 of 10 files uploaded"). `aria-valuetext` overrides the numeric `aria-valuenow` announcement and is useful when numeric values alone lack context.  
**Recommendation:** Add `aria-valuetext?: string` to `ProgressIndicatorProps` and forward it to the `role="progressbar"` element. Deferred to DS-007.

**N-005**  
**Location:** `packages/ui/src/interaction/modal.tsx:53`  
**Finding:** Modal header container uses hardcoded inline style: `{ alignItems: "center", display: "flex", justifyContent: "space-between" }`. Same pattern as DS-003 page-shell.tsx L-001. Minor — no token-equivalent for a 3-property flex layout helper, but breaks the token-derived pattern.  
**Recommendation:** Extract to a named style function in `interaction-styles.ts`. Low urgency.

**N-006**  
**Location:** `packages/ui/src/styles/interaction-styles.ts:141`  
**Finding:** `getToastStyle`'s `maxWidth: "24rem"` is hardcoded. No token equivalent for toast max-width. Structural constant; acceptable. Worth documenting in DS-001's sizing token group as part of DS-008 prep.

---

## Required Fixes Before Release

**H-001 (HIGH) — Dropdown ARIA misplacement**: `aria-expanded` and `aria-haspopup="menu"` must be moved from the wrapping `<div>` to the trigger element. Use `React.cloneElement` to inject these attributes onto the trigger, or redesign the trigger contract. Until fixed, the Dropdown's expanded state is invisible to screen readers.

**H-002 (HIGH) — Tooltip duplicate ID**: Replace `id="nextshift-tooltip"` with a per-instance unique ID via `React.useId()` or an equivalent. Until fixed, multiple simultaneous open tooltips will produce invalid HTML and incorrect `aria-describedby` resolution.

**M-001 (MEDIUM) — Modal missing `aria-labelledby`**: Add `aria-labelledby` pointing to the `<h2>` title when `title` is provided. Add an `aria-label` prop to `ModalProps` as a fallback when no visible title is rendered. Until fixed, dialogs have no accessible name for screen reader users.

**M-002 (MEDIUM) — Hardcoded rgba colors**: Tracked as a DS-001 token addition. Add overlay/scrim tokens to DS-001 semantic layer, then consume them in `getLoadingOverlayStyle` and `getModalBackdropStyle`. Until resolved, overlay and modal backdrop colors will not participate in DS-008 theming.

---

## Recommended Follow-ups

1. **(DS-005 patch)** Fix H-001: Dropdown ARIA — inject `aria-expanded`/`aria-haspopup` onto trigger via `React.cloneElement`, or redesign trigger prop contract.
2. **(DS-005 patch)** Fix H-002: Tooltip unique ID — use `React.useId()` per instance.
3. **(DS-005 patch)** Fix M-001: Modal `aria-labelledby` — link dialog to its heading; add `aria-label` prop fallback.
4. **(DS-001 patch → DS-005 patch)** Add `overlay.background` and `overlay.scrim` tokens to DS-001 semantic layer; consume in `getLoadingOverlayStyle` and `getModalBackdropStyle`.
5. **(DS-005 patch / DS-007)** Add `aria-hidden="true"` to `Spinner` inside `LoadingOverlay` — resolves L-001. Batch with DS-004 DashboardLoadingState L-001 fix.
6. **(DS-005 patch / DS-007)** Replace hardcoded spinner sizes with spacing tokens — resolves L-002.
7. **(DS-005 patch / DS-007)** Replace `theme.chart.tooltip.*` with dedicated semantic tooltip tokens or surface/border/foreground tokens in `getTooltipStyle` — resolves L-003.
8. **(DS-001 patch)** Add dedicated `semanticTokens.tooltip.*` and `semanticTokens.overlay.*` groups to DS-001 in preparation for DS-008.
9. **(DS-007)** Implement focus trap for Modal/Dialog (documented limitation; deferred).
10. **(DS-007)** Add roving focus for Dropdown (documented limitation; deferred).
11. **(DS-007)** Add `aria-valuetext` prop to `ProgressIndicator` for human-readable progress descriptions.
12. **(DS-005 types)** Unify `InteractionSize` with DS-002's `ComponentSize` to eliminate type duplication — resolves N-001.
13. **(DS-005 tests)** Add hook tests for `useDisclosure` and `useKeyboardActivation`. These are untested — `renderToStaticMarkup` cannot trigger state updates.

---

## Final Recommendation

**DS-005 Interaction System is conditionally approved. Fix H-001 and H-002 before release.**

The architecture, token consumption, hook design, keyboard utilities, and DS-002/DS-003/DS-004 compatibility are sound. The two HIGH findings (Dropdown ARIA misplacement; Tooltip duplicate ID) are straightforward bugs that make two primitives unreliable for screen reader users. They do not require architectural changes — each is a small, isolated fix. The two MEDIUM findings (Modal accessible name; hardcoded rgba) can be addressed in the same patch. Once H-001 and H-002 are resolved and re-verified, DS-005 is ready for release.
