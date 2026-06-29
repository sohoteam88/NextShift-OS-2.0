# DS-005 Interaction System Patch Re-Audit Report

**Audit Type:** Independent Patch Verification  
**Auditor:** Claude Code (Independent Architecture Auditor)  
**Date:** 2026-06-29  
**Project:** NextShift OS 3.1 / NextShift Design System v1.0  
**Slice:** DS-005 Interaction System — Patch Re-Audit

---

## Re-Audit Result

**PASS**

---

## Executive Summary

Both HIGH issues and both MEDIUM issues from the original DS-005 conditional pass have been correctly resolved. The Dropdown now injects `aria-expanded` and `aria-haspopup="menu"` directly onto the trigger element via `React.cloneElement`. The Tooltip now uses `React.useId()` to generate a unique, per-instance ID, eliminating the duplicate-ID defect. The Modal/Dialog now emits `aria-labelledby` linked to a `React.useId()`-generated heading ID when a title is present, and accepts consumer-provided `aria-label` via prop spread when no title exists. The overlay and modal scrim colors are no longer hardcoded — they are now defined in `semanticTokens.overlay.*`, promoted to `nextShiftThemeTokens.overlay`, and consumed by reference in `getLoadingOverlayStyle` and `getModalBackdropStyle`. All 43 tests pass. All 8 typechecks pass. No regressions introduced. DS-005 is ready for Verification and Release.

---

## Files Inspected

```
packages/ui/src/interaction/dropdown.tsx
packages/ui/src/interaction/tooltip.tsx
packages/ui/src/interaction/modal.tsx
packages/ui/src/interaction/dialog.tsx
packages/ui/src/styles/interaction-styles.ts
packages/shared/src/design-system/tokens/semantic-tokens.ts
packages/shared/src/design-system/tokens/theme-tokens.ts
packages/shared/test/design-system/design-tokens.test.ts
packages/ui/test/interaction-system.test.tsx
```

---

## Commands Executed

| Command | Result |
|---|---|
| `pnpm --filter @nextshift/ui test` | ✅ PASS — 4 files / 43 tests |
| `pnpm --filter @nextshift/ui typecheck` | ✅ PASS — 0 errors |
| `pnpm --filter @nextshift/shared test` | ✅ PASS — 1 file / 9 tests |
| `pnpm --filter @nextshift/shared typecheck` | ✅ PASS — 0 errors |
| `pnpm --filter @nextshift/domain test` | ✅ PASS — 31 files / 285 tests |
| `pnpm --filter @nextshift/domain typecheck` | ✅ PASS — 0 errors |
| `pnpm --filter @nextshift/application test` | ✅ PASS — 34 files / 211 tests |
| `pnpm --filter @nextshift/application typecheck` | ✅ PASS — 0 errors |

---

## Original Issue Resolution Matrix

| Original Issue | Severity | Status | Notes |
|---|---:|---|---|
| H-001 — Dropdown ARIA misplacement | HIGH | ✅ RESOLVED | `cloneElement` injects ARIA onto real trigger element |
| H-002 — Tooltip duplicate ID | HIGH | ✅ RESOLVED | `React.useId()` per instance; test verifies uniqueness |
| M-001 — Modal/Dialog missing accessible name | MEDIUM | ✅ RESOLVED | `aria-labelledby` links heading; `aria-label` via prop spread |
| M-002 — Hardcoded overlay/scrim rgba | MEDIUM | ✅ RESOLVED | `semanticTokens.overlay.*` + `theme.overlay.*` consumed |

---

## Dropdown ARIA Fix Findings

**Status: RESOLVED**

**Before:** `aria-expanded={open}` and `aria-haspopup="menu"` were applied to a wrapping non-interactive `<div>`, not to the trigger element.

**After:**
```tsx
const triggerWithAria = React.isValidElement(trigger)
  ? React.cloneElement(
      trigger as React.ReactElement<React.HTMLAttributes<HTMLElement>>,
      {
        "aria-expanded": open,
        "aria-haspopup": "menu",
      }
    )
  : trigger;

return (
  <div ...>
    <div>{triggerWithAria}</div>
    {open ? <div role="menu" aria-label={menuLabel} ...> : null}
  </div>
);
```

`React.isValidElement(trigger)` guards the `cloneElement` call — if trigger is a non-React-element (e.g., a plain string), it falls through without ARIA injection. In practice, a string trigger cannot be keyboard-activated, so this is the correct behavior; string triggers are a consumer misuse. The wrapper `<div>{triggerWithAria}</div>` is now semantically inert (no ARIA attributes).

**Test verification:** New dedicated test `"injects dropdown ARIA onto the real trigger"` renders:
- `open` trigger with `<Button>` — asserts `aria-expanded="true" aria-haspopup="menu">Open</button>` on the button element
- `open={false}` trigger — asserts `aria-expanded="false" aria-haspopup="menu">Closed</button>`
- Negative assertions: `not.toContain('<div aria-expanded=')` and `not.toContain('<div aria-haspopup=')` confirm attributes are no longer on any `<div>`

Both open and closed states are explicitly tested ✅. The cloneElement cast to `React.ReactElement<React.HTMLAttributes<HTMLElement>>` is not perfectly type-safe for arbitrary custom components (consumer components with non-HTML prop types won't have TypeScript enforce the injected ARIA attributes), but this is the standard pattern for this use case and is acceptable at the DS-005 baseline level.

**H-001: RESOLVED**

---

## Tooltip Unique ID Fix Findings

**Status: RESOLVED**

**Before:** `id="nextshift-tooltip"` hardcoded — all instances shared the same ID.

**After:**
```tsx
const tooltipId = React.useId();
// ...
<span aria-describedby={open ? tooltipId : undefined}>{children}</span>
{open ? (
  <span id={tooltipId} role="tooltip" ...>{content}</span>
) : null}
```

`React.useId()` is a React 18 hook that generates a unique ID per component instance, stable across renders, and SSR-compatible. Confirmed working with `renderToStaticMarkup` — the test suite uses this renderer and all assertions pass ✅.

**Test verification:** New dedicated test `"renders unique tooltip IDs and matching aria-describedby"` renders two open `Tooltip` instances and:
- Extracts all `aria-describedby` values via regex — asserts length 2
- Extracts all `id` values with `role="tooltip"` — asserts length 2
- Asserts `new Set(tooltipIds).size === 2` — both IDs are distinct
- Asserts `describedByValues` equals `tooltipIds` — each `aria-describedby` matches its own tooltip's ID
- Asserts `not.toContain("nextshift-tooltip")` — old hardcoded string is gone

This is a thorough uniqueness and linkage test ✅.

**H-002: RESOLVED**

---

## Modal/Dialog Accessible Name Fix Findings

**Status: RESOLVED**

**Before:** `<div role="dialog">` had no `aria-labelledby` or `aria-label`; dialogs were announced without an accessible name.

**After:**
```tsx
const titleId = React.useId();

if (!open) { return null; }

return (
  <div role="presentation" ...>
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      {...props}
    >
      {title ? <h2 id={titleId} ...>{title}</h2> : null}
      ...
    </div>
  </div>
);
```

`React.useId()` is called unconditionally before the `if (!open) { return null; }` guard — hooks must not be called conditionally, and this ordering is correct ✅.

When `title` is provided: `aria-labelledby={titleId}` links the dialog to its `<h2 id={titleId}>` heading. Screen readers will announce the heading text as the dialog's name ✅.

When `title` is absent: `aria-labelledby={undefined}` — attribute omitted from DOM. Consumer passes `aria-label` via `...props` spread. Because `ModalProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title">`, `aria-label` is part of the prop type and will be spread directly onto the `<div role="dialog">` ✅.

No empty `aria-labelledby=""` or `aria-label=""` is emitted in either case ✅.

**Dialog:** Inherits all Modal behavior via `<Modal {...props} />` spread. No changes needed — `Dialog` correctly propagates `title` (and therefore the `aria-labelledby`/`titleId` mechanism) through to `Modal` ✅.

**Test verification:** Updated test `"renders modal and dialog contracts with accessible names"` covers:
- Titled modal: asserts `aria-labelledby=` and `<h2 id=` are present in markup ✅
- Untitled modal: `<Modal aria-label="Untitled modal">` — asserts `aria-label="Untitled modal"` in markup ✅
- Danger dialog: asserts `data-dialog-tone="danger"` ✅

**M-001: RESOLVED**

---

## Overlay/Scrim Tokenization Findings

**Status: RESOLVED**

**Before:** `getLoadingOverlayStyle` had `"rgba(255, 255, 255, 0.82)"` and `getModalBackdropStyle` had `"rgba(17, 24, 39, 0.48)"` hardcoded.

**After — DS-001 addition (`semantic-tokens.ts`):**
```ts
overlay: {
  background: "rgba(255, 255, 255, 0.82)",
  scrim: "rgba(17, 24, 39, 0.48)",
},
```

**After — theme promotion (`theme-tokens.ts`):**
```ts
overlay: semanticTokens.overlay,
```
`theme.overlay` is now a first-class key alongside `color`, `spacing`, `motion`, etc. ✅

**After — consumption (`interaction-styles.ts`):**
```ts
// getLoadingOverlayStyle
background: theme.overlay.background,

// getModalBackdropStyle
background: theme.overlay.scrim,
```

No hardcoded rgba strings remain in either function ✅.

The rgba values are inline literals in `semanticTokens.overlay` rather than derived from `primitiveTokens.*`. This is the correct design decision — primitive tokens contain solid colors; semi-transparent overlay values have no natural primitive ancestor. The semantic layer is the appropriate home for these values. DS-008 can override `semanticTokens.overlay.*` to provide dark-theme equivalents. Token promotion is backward-compatible: no prior consumers referenced `theme.overlay` because it didn't exist.

**Shared token test coverage:**
```ts
expect(semanticTokens.overlay.background).toBe("rgba(255, 255, 255, 0.82)");
expect(semanticTokens.overlay.scrim).toBe("rgba(17, 24, 39, 0.48)");
expect(nextShiftThemeTokens.overlay.scrim).toBe(semanticTokens.overlay.scrim);
```
Both semantic and theme-level overlay tokens are tested ✅.

**UI test coverage:**
```ts
expect(getLoadingOverlayStyle("center").background).toBe(
  nextShiftThemeTokens.overlay.background
);
expect(getModalBackdropStyle().background).toBe(
  nextShiftThemeTokens.overlay.scrim
);
```
Token consumption is verified by reference equality ✅.

**M-002: RESOLVED**

---

## Regression Findings

No regressions introduced.

- No new package dependencies added. `React.useId()` and `React.cloneElement()` are built-in React APIs ✅
- No runtime redesign, governance changes, database changes, backend APIs ✅
- No routing, persistence, global notification service, external state management ✅
- No business UI, charts, or unrelated refactors ✅
- DS-001 token additions are strictly additive — no existing token paths removed or renamed ✅
- DS-002 (`Button`, `Spinner`, all component exports) intact — backward compat test passes ✅
- DS-003 (`AppShell` and all layout exports) intact ✅
- DS-004 (`DashboardShell` and all dashboard exports) intact ✅
- TypeScript: 0 errors across all 4 packages ✅
- Tests: 43/43 UI, 9/9 shared, 285/285 domain, 211/211 application — all passing ✅

The `SemanticTokens` and `ThemeTokens` TypeScript types automatically incorporate the new `overlay` key since `semantic-tokens.ts` is `as const` inferred — no manual type declaration required, and the typecheck confirms no type errors ✅.

---

## Test Coverage Findings

The patch increased the DS-005 interaction test count from 9 to 10 (total suite: 42 → 43). The original test `"renders dropdown and tooltip"` was split and expanded into two focused tests:

1. **`"injects dropdown ARIA onto the real trigger"`** — verifies both open and closed states; verifies ARIA is on the button, not a div.
2. **`"renders unique tooltip IDs and matching aria-describedby"`** — verifies ID uniqueness, linkage, and absence of the old hardcoded string.

The modal test was expanded in place to cover both `aria-labelledby` (with title) and `aria-label` (without title).

The token test was expanded with two new assertions for `getLoadingOverlayStyle` and `getModalBackdropStyle`.

All patch-specific behaviors are now explicitly tested. Coverage is appropriate for a patch verification ✅.

---

## Documentation Findings

DS-005 README and IMPLEMENTATION_REPORT were updated per the patch report. No material gaps introduced by the patch. Remaining documentation notes from the original audit (overlay positioning requirement, tooltip multi-instance behavior clarification, Dropdown trigger contract) are carry-forward items — none of them newly blocking.

---

## Remaining Issues

All items below are carry-forward from the original DS-005 audit at LOW or NOTE severity. None were in scope for this patch and none block release.

**LOW (carry-forward from original audit):**

- **L-001**: `LoadingOverlay` still composes `Spinner` inside `<div role="status">`, resulting in nested live regions. Spinner should receive `aria-hidden="true"` inside `LoadingOverlay`. Deferred to DS-007 batch alongside DS-004 DashboardLoadingState L-001.
- **L-002**: `getInteractionSpinnerStyle` still uses hardcoded `"1rem"`, `"1.25rem"`, `"2rem"` instead of spacing tokens. Deferred.
- **L-003**: `getTooltipStyle` still sources from `theme.chart.tooltip.*`. Deferred to DS-001 tooltip token addition.

**NOTE (carry-forward):**

- **N-001**: `InteractionSize` duplicates DS-002's `ComponentSize`.
- **N-002**: `focus-ring.ts` and `motion.ts` are thin re-export wrappers.
- **N-003**: `getInteractionStateStyle` asymmetry between styles barrel and interaction barrel.
- **N-004**: `ProgressIndicator` has no `aria-valuetext` prop.
- **N-005**: Modal close button has no `aria-label` for icon-only variants.
- **N-006**: `getToastStyle` `maxWidth: "24rem"` is hardcoded.

---

## Required Fixes Before Release

None.

All original release blockers are resolved. Remaining issues are LOW or NOTE severity, all carry-forward from the original audit, all appropriate for DS-007 or future hardening.

---

## Recommended Follow-ups

1. **(DS-007)** Add `aria-hidden="true"` to `Spinner` inside `LoadingOverlay` — resolves carry-forward L-001. Batch with DS-004 DashboardLoadingState.
2. **(DS-007)** Add `role="toolbar"` + `aria-label` to `DashboardToolbar` and `DashboardFilterBar` — carry-forward from DS-004.
3. **(DS-007)** Modal/Dialog focus trap implementation — documented known limitation.
4. **(DS-007)** Dropdown roving focus — documented known limitation.
5. **(DS-001 patch)** Add `semanticTokens.tooltip.*` tokens derived from `color.surface/border/foreground`; update `getTooltipStyle` to consume them instead of `chart.tooltip.*` — resolves L-003.
6. **(DS-005 types)** Unify `InteractionSize` with DS-002's `ComponentSize` — resolves N-001.
7. **(DS-005 cleanup)** Remove `focus-ring.ts` and `motion.ts` thin re-export wrappers; export directly from `interaction/index.ts` — resolves N-002.

---

## Final Recommendation

**DS-005 Interaction System patch is verified. Proceed to DS-005 Verification and Release.**

Both HIGH release blockers (Dropdown ARIA misplacement, Tooltip duplicate ID) are fully resolved with correct implementations and new targeted tests. Both MEDIUM issues (Modal accessible name, overlay/scrim tokenization) are fully resolved. All 548 tests across the monorepo pass with zero typecheck errors. No regressions were introduced. DS-005 is ready for release.
