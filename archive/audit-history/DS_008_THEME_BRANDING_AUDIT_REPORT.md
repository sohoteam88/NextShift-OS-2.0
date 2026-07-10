# DS-008 Theme & Branding Audit Report

**Audit Type:** Independent Code + Architecture Audit  
**Auditor:** Claude Code (Independent Architecture Auditor)  
**Date:** 2026-06-29  
**Project:** NextShift OS 3.1 / NextShift Design System v1.0  
**Slice:** DS-008 Theme & Branding

---

## Audit Result

**PASS WITH MINOR NOTES**

---

## Executive Summary

DS-008 Theme & Branding is correctly scoped, well-structured, and production-ready. `ThemeProvider`, `ThemeContext`, light and dark themes, brand token overrides, OEM/white-label contracts, theme switching helpers, the persistence contract interface, and CSS variable generation are all correctly implemented. The dark theme values are token-derived from DS-001 primitives. The `mergeThemeTokens` deep-merge handles all token shapes including array palette replacement. The `ThemeProvider` correctly implements the React controlled/uncontrolled pattern for mode state. The persistence contract is correctly an interface only — no storage implementation, no backend API, no routing, no business logic. DS-001 through DS-007 compatibility is fully intact: 69/69 tests pass, zero typecheck errors across all four packages.

Three LOW findings cover design decisions that need clearer documentation: `persistence.loadThemeMode` is not called automatically by the provider (consumers must call it and pass the result as `defaultMode`); `ThemeProvider` wraps children in a plain `<div>` which can affect strict flex/grid layouts; and `systemPrefersDark` requires the consumer to wire a `matchMedia` listener since the theme cannot self-update from OS changes. Three NOTE-level findings cover a minor double-computation, the unexposed `includeSystem` toggle cycle, and sparse documentation. No blockers, no HIGH, no MEDIUM findings.

**Should proceed to Project Verification, Project Audit, and Project Release.**

---

## Files Inspected

```
packages/ui/src/theme/index.ts
packages/ui/src/theme/theme-context.tsx
packages/ui/src/theme/theme-provider.tsx
packages/ui/src/theme/theme-styles.ts
packages/ui/src/theme/theme-utils.ts
packages/ui/src/types/theme-types.ts
packages/ui/src/index.ts
packages/ui/src/styles/index.ts
packages/ui/src/types/index.ts
packages/ui/test/theme-branding.test.tsx
packages/shared/src/design-system/tokens/primitive-tokens.ts (dark theme value verification)
docs/nextshift-os-3/design-system/slices/DS-008-theme-branding/README.md
docs/nextshift-os-3/design-system/slices/DS-008-theme-branding/IMPLEMENTATION_REPORT.md
```

---

## Commands Executed

| Command | Result |
|---|---|
| `pnpm --filter @nextshift/ui test` | ✅ PASS — 7 files / 69 tests |
| `pnpm --filter @nextshift/ui typecheck` | ✅ PASS — 0 errors |
| `pnpm --filter @nextshift/shared test` | ✅ PASS — 1 file / 9 tests |
| `pnpm --filter @nextshift/shared typecheck` | ✅ PASS — 0 errors |
| `pnpm --filter @nextshift/domain test` | ✅ PASS — 31 files / 285 tests |
| `pnpm --filter @nextshift/domain typecheck` | ✅ PASS — 0 errors |
| `pnpm --filter @nextshift/application test` | ✅ PASS — 34 files / 211 tests |
| `pnpm --filter @nextshift/application typecheck` | ✅ PASS — 0 errors |

---

## Findings

### Scope Boundary

DS-008 stayed within scope. No violations found.

Confirmed absent: runtime redesign, governance changes, database changes, backend APIs, business capability changes, routing, data fetching, storage implementation, theme switcher business UI, React Router integration, Next.js middleware, cookie handling, localStorage calls, global window event listeners, new UI framework dependencies. The persistence contract is an interface-only definition — `ThemePersistenceContract` with optional `loadThemeMode` and `saveThemeMode` — containing no implementation ✅.

The only intra-package dependency: `ThemeProvider` imports `mergeStyles` from `../styles` (DS-002 utility) and `ThemeContext` uses `getThemeForMode` from `theme-utils`. Both are intra-package within `@nextshift/ui` ✅.

### Package Extension

DS-008 correctly extends `@nextshift/ui`. No second package was created. No new `package.json` dependencies. Extension is additive:

- New `packages/ui/src/theme/` directory — 5 files ✅
- New `packages/ui/src/types/theme-types.ts` ✅
- `packages/ui/src/index.ts` updated with `export * from "./theme"` — additive ✅
- `packages/ui/src/styles/index.ts` updated with 4 theme style function exports ✅
- `packages/ui/src/types/index.ts` updated with 8 theme type exports ✅

Cleanup noted: `packages/ui/node_modules` and `tsconfig.tsbuildinfo` removed — appropriate (build artifacts, not committed files) ✅.

### ThemeProvider

```tsx
export function ThemeProvider({
  mode, defaultMode = "light", brandOverride,
  persistence, systemPrefersDark = false, children,
}: ThemeProviderProps): React.ReactElement {
  const [internalMode, setInternalMode] = React.useState<ThemeMode>(defaultMode);
  const currentMode = mode ?? internalMode;
  ...
}
```

**Controlled/uncontrolled pattern:** `currentMode = mode ?? internalMode` — standard React pattern. When `mode` is provided, it's controlled (internal state not updated on `setMode`). When omitted, it's uncontrolled (internal state drives rendering). ✅

**`setMode` callback:**
```ts
const setMode = React.useCallback((nextMode: ThemeMode) => {
  if (mode === undefined) {
    setInternalMode(nextMode);
  }
  void persistence?.saveThemeMode?.(nextMode);
}, [mode, persistence]);
```
- Uncontrolled: updates internal state + saves to persistence ✅
- Controlled: only saves to persistence (parent drives re-render) ✅
- `void persistence?.saveThemeMode?.(nextMode)` — discards the Promise correctly. Unhandled rejection if adapter throws — consumer is responsible for error handling in their adapter ✅ (by contract)

**Root div:** `ThemeProvider` wraps children in `<div data-nextshift-theme-provider="">` with `background`, `color`, and CSS variable styles. This div is necessary to establish the CSS variable scope and the theme surface color. See Issues L-002.

**`useMemo` for context value:** Computed from `[brandOverride, currentMode, setMode, systemPrefersDark]` — correct dependencies. `setMode` is stable via `useCallback([mode, persistence])` — stable reference ✅.

**`getThemeForMode` called twice per render:** Once in `createThemeContextValue` (which is memoized) and once in `getThemeRootStyle` (called directly in the JSX). The second call happens inside the render path itself, outside the memo. For a small token object, this is negligible cost. See Issues N-001.

### ThemeContext

```ts
export const ThemeContext = React.createContext<ThemeContextValue>({
  brand: undefined,
  mode: "light",
  resolvedMode: "light",
  setMode: () => undefined,
  theme: getThemeForMode("light"),
  toggleMode: () => undefined,
});
```

Default context provides light theme — safe and deterministic default ✅. `useTheme()` returns the raw `useContext(ThemeContext)` — consumer gets the default value if used outside `ThemeProvider`. Documented limitation (not a bug; React context standard behavior) ✅.

`createThemeContextValue` correctly assembles the full context value including `resolvedMode`, `toggleMode`, and the merged brand theme ✅.

### Light and Dark Themes

**`nextShiftLightTheme = nextShiftThemeTokens`** — the DS-001 default token set. Light theme is the baseline ✅.

**`nextShiftDarkTheme`** — built by deep-merging dark overrides into the light theme:

| Token | Dark value | Primitive |
|---|---|---|
| `color.background` | `#030712` | `neutral.950` ✅ |
| `color.foreground` | `#f9fafb` | `neutral.50` ✅ |
| `color.surface` | `#111827` | `neutral.900` ✅ |
| `color.surfaceMuted` | `#1f2937` | `neutral.800` ✅ |
| `color.border` | `#374151` | `neutral.700` ✅ |
| `color.borderStrong` | `#4b5563` | `neutral.600` ✅ |
| `color.primary` | `#60a5fa` | `brand.400` — lighter blue for dark ✅ |
| `color.primaryForeground` | `#030712` | `neutral.950` — dark text on light primary ✅ |
| `color.muted` | `#1f2937` | `neutral.800` ✅ |
| `color.mutedForeground` | `#d1d5db` | `neutral.300` ✅ |
| `color.focusRing` | `#93c5fd` | `brand.300` — lighter ring ✅ |
| `overlay.background` | `rgba(3,7,18,0.82)` | dark scrim ✅ |
| `chart.grid` | `#374151` | `neutral.700` ✅ |
| `chart.axis` | `#d1d5db` | `neutral.300` ✅ |

All dark theme values are token-derived from DS-001 primitives — no arbitrary hex values ✅. Test confirms `nextShiftDarkTheme.color.background === "#030712"` and `.foreground === "#f9fafb"` ✅.

**Tokens NOT overridden in dark theme (all intentional):**
- `spacing`, `radius`, `elevation`, `typography`, `motion`, `zIndex` — layout/dimension tokens don't change between modes ✅
- `chart.categorical`, `chart.sequential` — shared palettes work on both backgrounds at sufficient contrast ✅ (consumer responsibility to validate per-palette)
- `state.*` — interaction state tokens stay consistent ✅

### Brand / OEM Overrides

**`WhiteLabelBrandingContract`:**
```ts
export interface WhiteLabelBrandingContract {
  readonly brandId: string;         // required — stable identifier
  readonly displayName: string;     // required — human-readable name
  readonly legalName?: string;
  readonly supportEmail?: string;
  readonly homepageUrl?: string;
  readonly assets?: ThemeBrandingAssets;
}
```
`brandId` is required — ensures every OEM tenant has a stable selector for CSS targeting via `data-nextshift-brand`. ✅

**`ThemeBrandingAssets`:** `logo`, `logoDark`, `icon`, `favicon`, `wordmark`, `altText` — all optional strings. `logoDark` is the only dark-mode-variant asset slot — see Issues N-003.

**`getBrandAsset`:**
```ts
if (key === "logo" && mode === "dark") {
  return brandOverride.brand.assets.logoDark ?? brandOverride.brand.assets.logo;
}
```
Falls back to `logo` when `logoDark` is absent — correct ✅. All other asset keys have no dark-mode fallback logic (only logo has a dark variant). Test verifies `getBrandAsset(brandOverride, "logo", "dark") === "/dark.svg"` ✅.

**`createBrandTheme(base, brandOverride)`:** Delegates to `mergeThemeTokens(base, brandOverride?.tokens)` — clean single-level wrapping ✅.

**`mergeThemeTokens`:**
```ts
const merge = (target: unknown, source: unknown): unknown => {
  if (!isRecord(target) || !isRecord(source)) {
    return source ?? target;
  }
  const result: AnyRecord = { ...target };
  for (const [key, value] of Object.entries(source)) {
    result[key] = key in result ? merge(result[key], value) : value;
  }
  return merge(base, overrides) as ThemeTokens;
```
- Arrays: `isRecord` returns false for arrays, so array-valued tokens (e.g., `chart.categorical`) are replaced wholesale — correct behavior for palette overrides ✅
- `source ?? target` means `undefined` source values fall through to base — override must explicitly set a value to override ✅
- `key in result` check prevents losing new keys in source that don't exist in base ✅
- The `as ThemeTokens` cast is necessary since deep-merge return type can't be statically verified without complex gymnastics — acceptable ✅

Test verifies isolated merge: `radius.lg` override doesn't affect `spacing["4"]` or `color.primary` ✅.

### Theme Switching Helpers

**`resolveThemeMode(mode, systemPrefersDark)`:**
- `"light"` → `"light"` ✅
- `"dark"` → `"dark"` ✅
- `"system"` → `systemPrefersDark ? "dark" : "light"` ✅

**`getNextThemeMode(mode, options)`:**

Without `includeSystem`:
- `"light"` → `"dark"` ✅
- `"dark"` → `"light"` ✅
- `"system"` → resolves and inverts ✅

With `includeSystem: true` (three-way cycle):
- `"light"` → `"dark"` ✅
- `"dark"` → `"system"` ✅
- `"system"` (resolved dark) → `"light"` ✅
- `"system"` (resolved light) → `"dark"` ✅

**`toggleMode()` in context:** Calls `getNextThemeMode` without `includeSystem` — binary light/dark toggle. `"system"` mode resolves then inverts to a specific mode. The three-way cycle (`includeSystem: true`) is available via `getNextThemeMode` directly. See Issues N-002.

### Persistence Contract

```ts
export interface ThemePersistenceContract {
  readonly loadThemeMode?: () => ThemeMode | undefined | Promise<ThemeMode | undefined>;
  readonly saveThemeMode?: (mode: ThemeMode) => void | Promise<void>;
}
```

Interface-only — no implementation ✅. Both methods are optional — allows save-only or load-only adapters ✅. Async-capable for remote storage ✅.

**`loadThemeMode` is not called by `ThemeProvider`.** The provider accepts a `persistence` prop but only calls `saveThemeMode` via `setMode`. Consumers who pass a `persistence` object expecting automatic load-on-mount will be surprised — they must call `loadThemeMode()` themselves and pass the result as `defaultMode` or `mode`. This is by design (the provider doesn't hold async effects for storage bootstrap), but is not documented in the README. See Issues L-001.

### CSS Variable Helpers

**`toCssVariableName`:** Converts dot-path with camelCase to `--nextshift-` prefix kebab-case:
- `color.background` → `--nextshift-color-background` ✅
- `color.primaryForeground` → `--nextshift-color-primary-foreground` ✅
- `chart.categorical` is an array → skipped by `flattenThemeTokens` → no CSS var emitted ✅ (correct; arrays can't be a single CSS var)

**`flattenThemeTokens`:** Recursively flattens. Terminates on string/number (emits), skips arrays and nulls. Clean and correct ✅.

**`createThemeCssVariables`:** Emits all scalar token values as CSS custom properties on the root element. This means a consumer using standard CSS stylesheets can reference `var(--nextshift-color-primary)` instead of needing JS token imports ✅. Brand overrides flow through to CSS variables because `getThemeForMode` applies brand merge before flatteningtest confirms `--nextshift-color-primary:#123456` in rendered markup ✅.

**`getThemeRootAttributes`:** Returns `data-nextshift-theme` (resolved mode), `data-nextshift-theme-mode` (raw mode), and `data-nextshift-brand` (brandId if present). Enables CSS targeting: `[data-nextshift-theme="dark"] { ... }` for optional CSS augmentation ✅. `data-nextshift-brand` enables per-tenant CSS overrides in addition to token-level overrides ✅.

**`getThemedSurfaceStyle`:** Returns `{ background, color, fontFamily }` from `ThemeTokens`. Minimal, correct — enough to establish a themed surface without the full provider ✅.

### DeepPartial Type Design

```ts
type ThemeOverrideLeaf<T> = T extends string ? string
  : T extends number ? number
  : T extends readonly string[] ? readonly string[]
  : T;

export type DeepPartial<T> = {
  readonly [Key in keyof T]?: T[Key] extends readonly unknown[]
    ? ThemeOverrideLeaf<T[Key]>
    : T[Key] extends object
      ? DeepPartial<T[Key]>
      : ThemeOverrideLeaf<T[Key]>;
};

export type ThemeTokenOverrides = DeepPartial<ThemeTokens>;
```

Arrays are preserved as readonly arrays (not further decomposed). Leaf values are widened to their primitive types (not specific literals), allowing any valid override string. Objects recurse. This is the correct shape for a partial-override type against a deeply nested token tree ✅.

The trade-off: `ThemeTokenOverrides` allows `color: { primary: "not-a-color" }` — there's no hex/CSS-value validation at the type level. This is intentional and acceptable for a token system; contract validation is the consumer's responsibility ✅.

### Public API

`packages/ui/src/index.ts` exposes all DS-008 content via `export * from "./theme"`.

**Functions:**
- `mergeThemeTokens`, `resolveThemeMode`, `getNextThemeMode`, `createBrandTheme`, `getThemeForMode`, `getBrandAsset` ✅
- `nextShiftLightTheme`, `nextShiftDarkTheme` (exported constants) ✅
- `createThemeCssVariables`, `getThemeRootAttributes`, `getThemeRootStyle`, `getThemedSurfaceStyle` ✅
- `createThemeContextValue`, `useTheme` ✅

**Components:**
- `ThemeProvider`, `ThemeContext` ✅

**Types:**
- `ThemeMode`, `ResolvedThemeMode`, `ThemeTokenOverrides`, `DeepPartial`, `ThemeBrandingAssets`, `WhiteLabelBrandingContract`, `BrandThemeOverride`, `ThemePersistenceContract`, `ThemeContextValue`, `ThemeProviderProps` ✅

No internal utilities leaked. `toCssVariableName`, `flattenThemeTokens`, `isRecord`, `merge` (local closure) are all file-private ✅.

### Type Safety

All types use `readonly` properties. `ThemeMode = "light" | "dark" | "system"` literal union ✅. `ResolvedThemeMode = "light" | "dark"` ✅. `ContrastCompliance`, `AccessibilityLandmarkRole` etc. from DS-007 remain intact ✅.

`ThemeContextValue.setMode: (mode: ThemeMode) => void` — typed to ThemeMode, not string. Consumers can't pass invalid modes ✅.

`ThemePersistenceContract.loadThemeMode` return type includes `undefined` — correctly signals missing/unset persistence state ✅.

`getBrandAsset(brandOverride, key, mode)` — `key` typed as `keyof NonNullable<BrandThemeOverride["brand"]["assets"]>` which equals `keyof ThemeBrandingAssets`. TypeScript prevents passing invalid asset keys ✅.

### Test Coverage

8 new tests in `theme-branding.test.tsx` (69 total vs 60 prior):

| Test | Coverage |
|---|---|
| `exposes theme provider, context, helpers, and types` | Type construction for all types, component presence |
| `provides light and dark themes from DS-001 tokens` | Light = DS-001 baseline, dark background/foreground exact values, `getThemeForMode` routing |
| `resolves theme switching helpers` | `resolveThemeMode` all 4 cases, `getNextThemeMode` binary + `includeSystem` partial |
| `applies brand token overrides and asset contracts` | `createBrandTheme` override isolation, `getBrandAsset` with logoDark fallback, altText |
| `merges token overrides without changing unrelated token branches` | Partial merge isolation: radius override doesn't affect spacing or color |
| `renders ThemeProvider with root attributes and CSS variables` | SSR markup: data attributes, CSS var with brand override, children render |
| `creates context values and persistence-compatible setters` | `createThemeContextValue`, `toggleMode` state transition |
| `creates theme CSS variables and root style helpers` | `createThemeCssVariables`, `getThemeRootAttributes` (system+dark), `getThemeRootStyle`, `getThemedSurfaceStyle` |
| `keeps DS-001 through DS-007 compatibility visible through exports` | Button, AppShell, DashboardShell, LoadingOverlay, Sparkline, Landmark |

**Coverage gaps (all NOTE-level):**
- `getBrandAsset` with `brandOverride = undefined` — returns undefined; not explicitly tested
- `mergeThemeTokens` with array override (e.g., `chart.categorical`) — wholesale replacement not tested
- `ThemeProvider` in uncontrolled mode (no `mode` prop) — not tested
- `ThemeProvider.setMode` in controlled mode (persistence-only, no state update) — not tested
- `createThemeContextValue` with `systemPrefersDark = true` — not tested
- `getNextThemeMode("system", { includeSystem: true, systemPrefersDark: true })` third branch — not tested
- `getThemedSurfaceStyle` `fontFamily` field — not verified
- `getThemeRootAttributes` with no `brandOverride` — `data-nextshift-brand` is undefined — not tested

### DS-001 Through DS-007 Compatibility

All prior exports intact. Prior tests pass without modification: 60 prior tests (51 before DS-007) all still pass alongside 9 new DS-007 tests and 9 new DS-008 tests ✅.

`nextShiftLightTheme === nextShiftThemeTokens` — the DS-001 token constant remains accessible under its original name and is also aliased as `nextShiftLightTheme`. No breaking rename ✅.

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
**Location:** `packages/ui/src/theme/theme-provider.tsx:7–64` + `packages/ui/src/types/theme-types.ts:49–52`  
**Finding:** `ThemeProvider` accepts a `persistence` prop but only calls `saveThemeMode` — it does NOT call `loadThemeMode` automatically on mount. Consumers who pass a persistence adapter expecting the provider to restore the saved theme on initialization will be surprised: the provider renders with `defaultMode` (or `"light"` by default) regardless of what `loadThemeMode` returns. Consumers must call `loadThemeMode` themselves, await the result, and pass it as `defaultMode` or the controlled `mode` prop. This is a reasonable design choice (avoids async side effects inside a pure React component), but the README does not explain it.  
**Recommendation:** Add to the README: "`ThemePersistenceContract.loadThemeMode` is not called automatically. Call it before mounting `ThemeProvider` and pass the result as `defaultMode`. Example: `const savedMode = await persistence.loadThemeMode(); <ThemeProvider defaultMode={savedMode ?? "light"} persistence={persistence}>`."

**L-002**  
**Location:** `packages/ui/src/theme/theme-provider.tsx:39–63`  
**Finding:** `ThemeProvider` wraps `children` in a `<div>`. In layouts using direct flex/grid children expectations (e.g., `<AppShell>` as a direct child of a grid), the extra div breaks the layout. Consumers who expect a transparent wrapper must add `display: contents` to the provider div, which has limited browser support for accessibility trees (Chrome/Firefox ≥ 2020, Safari ≥ 15.4). Alternatively, consumers must account for this div in their layout.  
**Recommendation:** Document that `ThemeProvider` renders a `<div>` and that this div can be styled via `data-nextshift-theme-provider` attribute selector if needed. Consider accepting a `className` or `style` passthrough prop in a future version.

**L-003**  
**Location:** `packages/ui/src/theme/theme-provider.tsx:11` (`systemPrefersDark = false`)  
**Finding:** `ThemeProvider` accepts `systemPrefersDark` as a static boolean prop. It does NOT wire up `window.matchMedia("(prefers-color-scheme: dark)")` internally. If a consumer sets `defaultMode="system"` and does not update `systemPrefersDark` when the OS preference changes, the rendered theme will not update. The consumer must listen to `matchMedia` changes and re-pass the updated `systemPrefersDark` prop. This is the correct pattern for an inline-style token system (consistent with DS-007's `shouldReduceMotion` approach), but is not documented.  
**Recommendation:** Add to the README: "When using `mode='system'`, wire OS dark mode detection externally: `const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches`. Add a `matchMedia` change listener to keep `systemPrefersDark` updated."

### NOTE

**N-001**  
**Location:** `packages/ui/src/theme/theme-provider.tsx:41–60`  
**Finding:** `getThemeForMode` is called twice per render: once inside the memoized `createThemeContextValue` (which computes `value.theme`) and once inside `getThemeRootStyle` (called directly in the JSX outside the memo). The memo covers the first call; the second call runs on every render. For a token object of ~100 keys, this is negligible. No action required; mention if profiling ever surfaces it.

**N-002**  
**Location:** `packages/ui/src/theme/theme-utils.ts:49–71` (`getNextThemeMode`)  
**Finding:** `ThemeContext.toggleMode()` calls `getNextThemeMode` without `includeSystem: true`, so the three-way toggle cycle (light → dark → system → ...) is not exposed via `toggleMode`. Consumers who want a three-way toggle must call `getNextThemeMode(mode, { includeSystem: true })` manually and call `setMode`. This is a reasonable API decision (binary toggle is the common case), but the README does not document the three-way variant or how to access it.

**N-003**  
**Location:** `packages/ui/src/types/theme-types.ts:26–33` (`ThemeBrandingAssets`)  
**Finding:** `ThemeBrandingAssets` includes `logoDark` but no `iconDark`, `faviconDark`, or `wordmarkDark` variants. Brands that need dark-mode icons or favicons must handle them outside the contract. Minor; logos are the most common dark-mode asset variation.

**N-004**  
**Location:** `docs/nextshift-os-3/design-system/slices/DS-008-theme-branding/README.md`  
**Finding:** The README is minimal (four short sections). Missing: usage examples for `ThemeProvider` with `systemPrefersDark` wiring, `ThemePersistenceContract` load pattern, brand override consumer example, CSS variable consumer example, and explanation of controlled vs. uncontrolled mode.

---

## Required Fixes Before Release

None. All findings are LOW or NOTE. DS-008 is correctly scoped and fully functional. The LOW findings require only documentation additions; they do not change runtime behavior.

---

## Recommended Follow-ups

1. **(DS-008 docs)** Document `loadThemeMode` not-called-automatically pattern with a code example — resolves L-001.
2. **(DS-008 docs)** Document the `ThemeProvider` root `<div>` and the `data-nextshift-theme-provider` selector for consumer CSS targeting — resolves L-002.
3. **(DS-008 docs)** Document `systemPrefersDark` requiring consumer `matchMedia` listener wiring for live OS preference updates — resolves L-003.
4. **(DS-008 docs)** Add three-way toggle example using `getNextThemeMode(mode, { includeSystem: true })` — resolves N-002.
5. **(DS-008 future)** Consider adding `iconDark`, `faviconDark` to `ThemeBrandingAssets` when multi-asset dark variants are needed by OEM tenants — resolves N-003.
6. **(DS-008 test)** Add test for `mergeThemeTokens` with array override (categorical palette wholesale replacement) — covers the most non-obvious merge behavior.
7. **(DS-007 patch — now unblocked)** Wire `createFocusTrap` into DS-005 `Modal` and `Dialog`. DS-008 is the last design system slice; all tools are now available.
8. **(DS-005/DS-004/DS-006 patch — now unblocked)** Wire `LiveRegion` into `DashboardLoadingState`, `LoadingOverlay`, `VisualizationLoadingState` to resolve nested `role="status"`.

---

## Final Recommendation

**DS-008 Theme & Branding is production-ready. Proceed to Project Verification, Project Audit, and Project Release.**

The implementation is clean, correctly scoped, and correctly typed. The dark theme token palette is coherent and token-derived. The `mergeThemeTokens` deep merge is correct. The `ThemeProvider` controlled/uncontrolled pattern is standard React. The persistence contract is properly an interface only with no storage implementation. DS-001 through DS-007 compatibility is fully intact. All three LOW findings are documentation gaps, not implementation defects. With the documentation additions from the recommended follow-ups, DS-008 is ready for production adoption.

**Design System v1.0 (DS-001 through DS-008) is complete.**
