# DS-006 Data Visualization Audit Report

**Audit Type:** Independent Code + Architecture Audit  
**Auditor:** Claude Code (Independent Architecture Auditor)  
**Date:** 2026-06-29  
**Project:** NextShift OS 3.1 / NextShift Design System v1.0  
**Slice:** DS-006 Data Visualization

---

## Audit Result

**PASS WITH MINOR NOTES**

---

## Executive Summary

DS-006 Data Visualization is a clean, correctly scoped, and thoroughly token-driven extension to `@nextshift/ui`. All ten required visualization primitives are present, exported, and typed. All five helper APIs are correct and deterministic. Chart token consumption covers categorical palettes, sequential palettes, positive/negative/neutral indicators, grid, and axis tokens. DS-001 through DS-005 compatibility is intact with zero export conflicts. All 51 tests pass with zero typecheck errors across all packages. One MEDIUM finding was identified: the `formatChartValue` and `formatPercent` test assertions rely on the runtime environment's system locale and will fail in non-US CI/CD environments where `Intl.NumberFormat` defaults to a different decimal/thousands separator. Three LOW findings and four NOTEs cover empty palette fallbacks in color helpers, undocumented `formatPercent` conventions, missing list semantics on `Legend`, and minor structural style inlining. No blockers, no HIGH findings, no business scope violations, and no charting dependencies.

---

## Files Inspected

```
packages/ui/src/visualization/chart-container.tsx
packages/ui/src/visualization/chart-card.tsx
packages/ui/src/visualization/legend.tsx
packages/ui/src/visualization/axis.tsx
packages/ui/src/visualization/grid-lines.tsx
packages/ui/src/visualization/metric-card.tsx
packages/ui/src/visualization/sparkline.tsx
packages/ui/src/visualization/status-indicator.tsx
packages/ui/src/visualization/visualization-empty-state.tsx
packages/ui/src/visualization/visualization-loading-state.tsx
packages/ui/src/visualization/color-scale.ts
packages/ui/src/visualization/formatting.ts
packages/ui/src/visualization/index.ts
packages/ui/src/styles/visualization-styles.ts
packages/ui/src/types/visualization-types.ts
packages/ui/src/index.ts
packages/ui/src/styles/index.ts
packages/ui/src/types/index.ts
packages/ui/test/data-visualization.test.tsx
packages/shared/src/design-system/tokens/semantic-tokens.ts
packages/shared/src/design-system/tokens/theme-tokens.ts
docs/nextshift-os-3/design-system/slices/DS-006-data-visualization/README.md
docs/nextshift-os-3/design-system/slices/DS-006-data-visualization/IMPLEMENTATION_REPORT.md
```

---

## Commands Executed

| Command | Result |
|---|---|
| `pnpm --filter @nextshift/ui test` | ✅ PASS — 5 files / 51 tests |
| `pnpm --filter @nextshift/ui typecheck` | ✅ PASS — 0 errors |
| `pnpm --filter @nextshift/shared test` | ✅ PASS — 1 file / 9 tests |
| `pnpm --filter @nextshift/shared typecheck` | ✅ PASS — 0 errors |
| `pnpm --filter @nextshift/domain test` | ✅ PASS — 31 files / 285 tests |
| `pnpm --filter @nextshift/domain typecheck` | ✅ PASS — 0 errors |
| `pnpm --filter @nextshift/application test` | ✅ PASS — 34 files / 211 tests |
| `pnpm --filter @nextshift/application typecheck` | ✅ PASS — 0 errors |

---

## Scope Boundary Findings

DS-006 stayed within scope. No violations found.

Confirmed absent: runtime redesign, governance changes, database changes, backend APIs, business capability changes, CRM charts, revenue charts, analytics logic, Business Brain visualizations, data fetching, state persistence, routing, charting dependencies, external visualization libraries, theme switcher UI, unrelated refactors. No new packages or workspace dependencies were introduced.

All primitives are generic infrastructure: `ChartContainer`, `ChartCard`, `Legend`, `Axis`, `GridLines`, `MetricCard`, `Sparkline`, `StatusIndicator`, `VisualizationEmptyState`, `VisualizationLoadingState`. None encode business meaning. `MetricCard` uses generic `label`/`value`/`trend` props with no KPI-specific semantics. `StatusIndicator` uses visualization tones ("positive", "negative", "neutral", "info") with no business-specific meanings. Formatting helpers produce numbers and percentages with no business interpretation.

---

## Package Extension Findings

DS-006 correctly extends `@nextshift/ui` without creating a second package or adding dependencies:

- New `packages/ui/src/visualization/` directory — 13 files (10 components + 2 utility files + barrel) ✅
- New `packages/ui/src/styles/visualization-styles.ts` ✅
- New `packages/ui/src/types/visualization-types.ts` ✅
- `packages/ui/src/index.ts` updated with `export * from "./visualization"` — additive only ✅
- `packages/ui/src/styles/index.ts` updated with 13 visualization style function exports — additive only ✅
- `packages/ui/src/types/index.ts` updated with 6 visualization type exports — additive only ✅
- `packages/ui/package.json`, `tsconfig.json`, `vitest.config.ts` unchanged ✅

All DS-002 through DS-005 exports remain intact. The extension pattern is identical to DS-003 through DS-005. TypeScript typecheck confirms zero conflicts across all 4 packages ✅.

---

## Visualization Primitive Coverage Findings

All ten required primitives are implemented and exported:

| Primitive | File | Root Element | Composition |
|---|---|---|---|
| ChartContainer | `chart-container.tsx` | `<div>` | Independent; `role="img"` when labeled |
| ChartCard | `chart-card.tsx` | via `WidgetContainer` | Composes DS-004 Widget family |
| Legend | `legend.tsx` | `<div>` | Uses `getCategoricalColor` helper |
| Axis | `axis.tsx` | `<div aria-hidden="true">` | Structural, decorative |
| GridLines | `grid-lines.tsx` | `<svg aria-hidden="true">` | Native SVG lines |
| MetricCard | `metric-card.tsx` | `<div>` | Token-driven; `label` + `value` required |
| Sparkline | `sparkline.tsx` | `<svg role="img">` | Native SVG polyline; inline path builder |
| StatusIndicator | `status-indicator.tsx` | `<span>` | Color dot + required label |
| VisualizationEmptyState | `visualization-empty-state.tsx` | via `DashboardEmptyState` | Composes DS-004 |
| VisualizationLoadingState | `visualization-loading-state.tsx` | via `DashboardLoadingState` | Composes DS-004 |

All five required helper APIs present:

| Helper | File | Notes |
|---|---|---|
| `getCategoricalColor(index)` | `color-scale.ts` | Modulo wrapping on DS-001 palette |
| `getSequentialColor(index)` | `color-scale.ts` | Clamped to DS-001 palette bounds |
| `getToneColor(tone)` | `color-scale.ts` | Maps to DS-001 chart tokens |
| `formatChartValue(value, options)` | `formatting.ts` | `Intl.NumberFormat`-based |
| `formatPercent(value, options)` | `formatting.ts` | Delegates to `formatChartValue` |

All primitives are reusable, typed, minimal, and not business-specific. `Sparkline` is a lightweight SVG path builder, not a chart engine — it does not include axis rendering, legend, tooltips, or data bindings beyond a `SparklinePoint[]` input ✅.

---

## Token Consumption Findings

`visualization-styles.ts` imports `componentTokens` and `nextShiftThemeTokens` from `@nextshift/shared`. `color-scale.ts` imports `nextShiftThemeTokens` directly.

| Token Category | Used | Examples |
|---|---|---|
| Chart categorical palette | ✅ | `theme.chart.categorical` — `getCategoricalColor`, `getLegendSwatchStyle` |
| Chart sequential palette | ✅ | `theme.chart.sequential` — `getSequentialColor` |
| Chart positive/negative/neutral | ✅ | `theme.chart.positive/negative/neutral` — `toneColor`, `getSparklineStroke`, `getMetricTrendStyle`, `getStatusIndicatorStyle` |
| Chart grid token | ✅ | `theme.chart.grid` — `getGridLineStroke` |
| Chart axis token | ✅ | `theme.chart.axis` — `getAxisStyle` |
| Semantic colors | ✅ | `color.surface/foreground/border/mutedForeground/info` |
| Spacing | ✅ | `spacing["2"]`, `["3"]`, `["4"]`, `["8"]` |
| Radius | ✅ | `radius.full`, `radius.lg` |
| Elevation | ✅ | `elevation.sm` |
| Typography | ✅ | `fontFamily.sans`, `fontSize.sm/xs`, `fontWeight.bold/medium`, `lineHeight.normal/tight`, `typography.scale.heading.h3.fontSize` |
| Component tokens (card.*) | ✅ | `componentTokens.card.background/border/radius/shadow/foreground/padding` — `getChartCardStyle` |

**No hardcoded color values where tokens exist.** All visualization color decisions pass through `toneColor[tone]` or `getCategoricalColor`/`getSequentialColor`. SVG structural constants (`strokeWidth="0.5"` in GridLines, `strokeWidth="3"` in Sparkline) have no token equivalents — these are geometry/rendering constants, not design values. Structural layout minimums (`minHeight: "12rem"` in `getVisualizationStateStyle`) similarly have no token equivalent. Both are acceptable.

`getChartCardStyle` reuses `componentTokens.card.*` — consistent with DS-004's `DashboardPanel` which uses the same tokens, maintaining visual coherence between chart cards and dashboard panels ✅.

---

## DS-002 / DS-003 / DS-004 / DS-005 Compatibility Findings

DS-006 composes prior-slice primitives where appropriate and introduces no export conflicts:

- `ChartCard` → composes DS-004 `WidgetContainer`, `WidgetHeader`, `WidgetBody`, `WidgetFooter` ✅
- `VisualizationEmptyState` → composes DS-004 `DashboardEmptyState` ✅
- `VisualizationLoadingState` → composes DS-004 `DashboardLoadingState` ✅
- DS-005 `LoadingOverlay` / DS-002 `Button` / DS-003 `AppShell` / DS-004 `DashboardShell` exports all intact: backward compat test verifies all four ✅
- All 43 prior tests pass unchanged ✅
- TypeScript: 0 errors across all 4 packages ✅

No DS-006 symbol names conflict with DS-002 through DS-005: `Chart*`, `Visualization*`, `Legend`, `Axis`, `GridLines`, `Sparkline`, `MetricCard`, `StatusIndicator` are all distinct from prior export names ✅.

`VisualizationLoadingState` inherits the nested `role="status"` issue from DS-004 `DashboardLoadingState` (DS-004 L-001, DS-005 L-001). This is a carry-forward issue, not a DS-006 regression — see Remaining Issues N-004.

---

## Public API Findings

`packages/ui/src/index.ts` exposes all DS-006 content via `export * from "./visualization"`:

- **Components**: all 10 visualization primitives ✅
- **Prop types**: `ChartContainerProps`, `ChartCardProps`, `LegendProps`, `AxisProps`, `GridLinesProps`, `MetricCardProps`, `SparklineProps`, `StatusIndicatorProps`, `VisualizationEmptyStateProps`, `VisualizationLoadingStateProps` ✅
- **Helpers**: `getCategoricalColor`, `getSequentialColor`, `getToneColor`, `formatChartValue`, `formatPercent` ✅
- **Types**: `VisualizationTone`, `ChartContainerAspect`, `MetricTrend`, `LegendItem`, `SparklinePoint`, `ChartValueFormatOptions` ✅
- **Style functions** (via styles barrel): `getChartContainerStyle`, `getChartCardStyle`, `getLegendStyle`, `getLegendSwatchStyle`, `getAxisStyle`, `getGridLineStroke`, `getMetricCardStyle`, `getMetricValueStyle`, `getMetricTrendStyle`, `getSparklineStroke`, `getStatusIndicatorStyle`, `getStatusDotStyle`, `getVisualizationStateStyle` ✅

All internal constants (`toneColor`, `trendTone`, `aspectMap`) are file-private ✅.

Consumer import `import { ChartCard, ChartContainer, Sparkline, getCategoricalColor, formatPercent } from "@nextshift/ui"` works as expected ✅.

---

## Prop Typing Findings

| Type | Value | Notes |
|---|---|---|
| `VisualizationTone` | `"positive" \| "negative" \| "neutral" \| "info"` | Generic, not business-specific ✅ |
| `ChartContainerAspect` | `"wide" \| "square" \| "compact"` | Clean structural union ✅ |
| `MetricTrend` | `"up" \| "down" \| "flat"` | Directional, not business-specific ✅ |
| `LegendItem` | `{ label: string; color?: string }` | Optional color allows palette fallback ✅ |
| `SparklinePoint` | `{ x: number; y: number }` | Generic 2D point, no domain semantics ✅ |
| `ChartValueFormatOptions` | 5 optional fields including `locale` | Full locale control ✅ |

**`MetricCard`**: `label` and `value` are both required (`readonly label: React.ReactNode`, `readonly value: React.ReactNode`) — prevents the component from being rendered without its core semantic content ✅. `MetricCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title">` correctly avoids `HTMLElement.title` collision ✅.

**`ChartContainer`**: `role="img"` is emitted only when `label` is provided — avoids an unnamed landmark, which is correct ARIA practice ✅. When `label` is absent, the div is a generic container. No `aria-describedby` explicit prop — consumers pass it via native spread, which works. Ergonomically minor.

**`StatusIndicator`**: `label: React.ReactNode` is required — ensures the component never relies on color alone ✅.

**`Sparkline`**: `label` defaults to `"Sparkline"` — ensures `role="img"` always has an accessible name even without consumer input. This may be too generic in practice (the label should describe the data), but it prevents an unnamed image landmark. LOW-level ergonomic guidance issue.

All props support `className`, `style`, and spread of native element/SVG props ✅. No ref forwarding — consistent with DS-002 through DS-005 pattern ✅.

---

## Helper API Findings

**`getCategoricalColor(index: number): string`**
- Wraps with modulo: `palette[index % palette.length]` — handles any positive integer ✅.
- Edge case: if `palette.length === 0`, modulo produces `palette[0 % 0]` = `NaN` index → `undefined`. The `chart.categorical` palette is defined in `primitiveTokens` and has length > 4 (verified by shared token test), so this is not a practical risk. However, no defensive guard exists. **LOW concern** — see Issues L-001.

**`getSequentialColor(index: number): string`**
- Clamps: `palette[Math.max(0, Math.min(index, palette.length - 1))]` ✅.
- Out-of-bounds clamped correctly for any defined palette. Same empty-palette concern as above. **LOW concern** — see Issues L-001.

**`getToneColor(tone: VisualizationTone): string`**
- Handles "positive" → `chart.positive`, "negative" → `chart.negative`, "info" → `color.info`, fallthrough → `chart.neutral` (catches "neutral"). Clean and exhaustive for all 4 values of `VisualizationTone` ✅. No business semantics ✅.

**`formatChartValue(value: number, options: ChartValueFormatOptions = {}): string`**
- Uses `new Intl.NumberFormat(options.locale, ...)`. When `options.locale` is undefined, the format uses the runtime's default locale.
- `maximumFractionDigits` defaults to 2; configurable ✅.
- `prefix`/`suffix` are string-concatenated after formatting ✅.
- Test: `expect(formatChartValue(1234.567, { maximumFractionDigits: 1 })).toBe("1,234.6")` — this assertion assumes US/English locale (comma as grouping separator, period as decimal separator). In a CI/CD environment with a non-US locale (e.g., `de_DE`), `Intl.NumberFormat` produces `"1.234,6"` and the test fails. **MEDIUM concern** — see Issues M-001.

**`formatPercent(value: number, options: ChartValueFormatOptions = {})`**
- Delegates to `formatChartValue` with `suffix: "%"` and `maximumFractionDigits: 1`.
- Convention: `value` is treated as already-in-percent form (e.g., `formatPercent(12.345)` → `"12.3%"`, not `"1234.5%"` nor `"0.1%"`). This is a common SaaS dashboard convention (the caller provides a pre-calculated percentage), but is not documented in the function signature, README, or JSDoc.
- Same locale sensitivity as `formatChartValue`. **LOW concern** — see Issues L-002.
- Test `formatPercent(12.345) === "12.3%"` confirms convention but relies on US locale.

---

## SVG / Visualization Semantics Findings

**Sparkline:**
- `buildSparklinePath` handles empty `points = []`: returns `""`. SVG `<path d="">` is valid and renders nothing ✅.
- Single point `[{x:0, y:0}]`: `xRange = maxX - minX = 0 → 1` (guarded), `yRange = maxY - minY = 0 → 1` (guarded). Produces `"M 0.00 0.00"` — a single moveto, renders as a dot or nothing (path with only M has no visible segments). Correct degenerate behavior ✅.
- `role="img"` always present; `aria-label` always present (default "Sparkline") ✅.
- SVG `viewBox="0 0 100 100"` with `preserveAspectRatio="none"` — scales to fill the host element. Consumer controls size via CSS on the outer element ✅.
- Path coordinates use `.toFixed(2)` — minimal precision without floating-point noise ✅.

**GridLines:**
- `aria-hidden="true"` — correctly treated as decorative ✅.
- `viewBox="0 0 100 100"` with `preserveAspectRatio="none"` — fills host ✅.
- `strokeWidth="0.5"` in SVG user coordinates — appropriate thin line for grid in a 0-100 unit space. No token equivalent — structural constant ✅.
- Generates `rows + 1` and `columns + 1` lines to include both boundary lines (at ratio 0 and 1). Correct grid geometry ✅.

**Axis:**
- `aria-hidden="true"` — correctly decorative ✅.
- Labels rendered as `<span>` inside `<div>` with `justifyContent: "space-between"` — visual positioning only. Not semantic axis data.
- Duplicate label keys: `key={label}` on each span. If `labels` contains duplicate strings, React warns and keys are non-unique. **NOTE-level** concern — consumer data may have duplicate labels (e.g., two months named the same). `key={index}` or `key={\`${label}-${index}\`}` would be safer.

**Legend:**
- Swatch `<span aria-hidden="true" .../>` ✅.
- Label text rendered as plain text inside outer `<span>` — readable ✅.
- Legend items rendered as `<span>` inside a `<div>` — no `<ul>/<li>` structure. Screen readers encounter a sequence of inline text spans. While readable, a `<ul role="list">` + `<li>` structure would convey group semantics more precisely. **LOW concern** — see Issues L-003.
- Legend container has no `aria-label` or `role` — generic div, not a navigation or list landmark. Acceptable at baseline.
- Key: `key={\`${item.label}-${index}\`}` — combines label and index, safe against duplicate labels ✅.

**MetricCard:**
- `label` → `<span>`, `value` → `<p>`, `trendLabel` → `<span>`, `description` → `<span>`. Text hierarchy is readable; `<p>` for value is correct block-level semantic ✅.
- `label` and `value` are required — prevents a metric with no visible information ✅.
- No explicit ARIA role on the container. Reads as a generic `<div>`. For an important KPI, consumers could pass `role="region"` + `aria-label` via spread. Acceptable at baseline.

**StatusIndicator:**
- Color dot is `aria-hidden="true"` ✅. Label is required and visible ✅. Passes color-only conveyance check ✅.
- Tone is conveyed via both color (visual) and text label (semantic) ✅.

---

## Accessibility Findings

**ChartContainer**: `role="img"` + `aria-label` when `label` is provided — clean, correct ✅. Without `label`, no role — container is generic. Consumer who wants to expose a description can pass `aria-describedby` via native spread. No `aria-describedby` prop — minor ergonomic gap, not a defect.

**Sparkline**: `role="img"` always ✅, `aria-label` always ✅. Single-point and empty data degenerate safely ✅. Default label "Sparkline" is generic — consumers should provide descriptive labels. Acceptable at baseline.

**GridLines**: `aria-hidden="true"` ✅. Correct decorative treatment.

**Axis**: `aria-hidden="true"` ✅. Axis labels are visual scaffolding; the chart's `aria-label` conveys the chart's content. Correct approach.

**Legend**: Color swatches hidden (`aria-hidden="true"` on each swatch `<span>`) ✅. Text labels are read sequentially by screen readers. Missing list semantics — see Issues L-003. No `aria-label` on the legend container, but the individual labels are readable.

**MetricCard**: `label` and `value` required — ensures screen readers always find the metric content ✅. Trend label is optional; when present, it includes both a text value and visual color ✅.

**VisualizationEmptyState**: Composes `DashboardEmptyState` → DS-002 `EmptyState` with `role="status"` ✅.

**VisualizationLoadingState**: Composes `DashboardLoadingState`. Inherits DS-004 L-001 nested `role="status"` (outer div + inner Spinner both have `role="status"`). This is a carry-forward from DS-004/DS-005 — not a DS-006 regression. Will be resolved when DS-007 batch fixes that pattern. See Issues N-004.

**Focus**: No `outline: none` or focus ring removal anywhere in `visualization-styles.ts` ✅. Interactive elements (if any chart children have interactive controls) are not blocked.

**No new serious accessibility defects introduced by DS-006.** ✅

---

## Styling Strategy Findings

All visualization style properties are token-derived from DS-001. No external charting library, no Tailwind, no Radix, no shadcn ✅. Styling does not block DS-008 Theme & Branding — all colors, typography, spacing, and radius values come from `nextShiftThemeTokens` ✅.

`getChartCardStyle` reuses `componentTokens.card.*` — visually consistent with DS-004 `DashboardPanel` elevated variant ✅.

**Inline structural layout in `Axis`:** `axis.tsx` merges `getAxisStyle()` with hardcoded inline layout properties (`display: "flex"`, `flexDirection: orientation === "horizontal" ? "row" : "column"`, `justifyContent: "space-between"`). These are orientation-dependent layout properties without token equivalents. The pattern is consistent with DS-003 `page-shell.tsx` and DS-005 `modal.tsx` header patterns (N-005 in DS-005). Extracting these to a style function would be cleaner. **NOTE-level** — see Issues N-001.

**`strokeWidth` constants**: `"0.5"` for GridLines, `"3"` for Sparkline — SVG geometry constants in a 0-100 viewBox coordinate space. No DS-001 token equivalents exist or are needed. Acceptable ✅.

**`minHeight: "12rem"` in `getVisualizationStateStyle`**: No token equivalent for state container heights. Structural constant; acceptable ✅.

---

## Test Coverage Findings

8 tests in `data-visualization.test.tsx`, all passing (43 prior + 8 = 51 total):

| Test | Coverage |
|---|---|
| `exposes visualization components, helpers, and types` | All 10 components + type assignments |
| `renders chart container and chart card` | ChartCard + ChartContainer composition, role="img", aria-label |
| `renders legend, axis, and grid lines` | data-nextshift-visualization attrs, label text, SVG line |
| `renders metric, sparkline, and status indicator` | value/trend/path/label rendering |
| `renders visualization empty and loading states` | data attrs, aria-label on loading |
| `uses DS-001 visualization tokens` | 6 token value assertions |
| `formats chart values` | 3 format assertions with prefix/suffix/percent |
| `keeps DS-001 through DS-005 compatibility visible through exports` | Button, AppShell, DashboardShell, LoadingOverlay |

**Coverage gaps (all NOTE or LOW level):**

- `ChartContainer` without `label` (no `role="img"` emitted) — not tested
- `Sparkline` with `points=[]` (empty path) — not tested
- `Sparkline` with single point — not tested
- `getCategoricalColor` with `index >= palette.length` (wrapping behavior) — not tested
- `getSequentialColor` with `index < 0` or `index > palette.length - 1` (clamping) — not tested
- `formatChartValue` with explicit `locale`, `minimumFractionDigits` — not tested
- `formatPercent` with option overrides — not tested
- `MetricCard` without `trendLabel` or `description` — not tested
- `VisualizationEmptyState` with `action` slot — not tested
- `StatusIndicator` all tones (only "negative" tested) — not tested
- `Axis` vertical orientation — not tested
- `Legend` with explicit `color` on items — not tested (only `getCategoricalColor` fallback)

**Locale risk in existing tests:** The test `expect(formatChartValue(1234.567, { maximumFractionDigits: 1 })).toBe("1,234.6")` and `expect(formatPercent(12.345)).toBe("12.3%")` both depend on the runtime producing US-format numbers without an explicit locale argument. These tests will fail in CI environments running with a non-US locale. See Issues M-001.

---

## Documentation Findings

**DS-006 README** covers: purpose, complete primitive and helper list, token model, composition model, accessibility baseline, non-goals, and example usage. Concise and complete.

**DS-006 IMPLEMENTATION_REPORT** covers: scope, architecture decision, files created/modified, test results, typecheck results, known limitations, and backward compatibility. Complete.

**Minor documentation gaps (NOTE-level):**
- README does not document `formatPercent` convention: value is expected in percent form (e.g., `12.5` for 12.5%), not as a [0, 1] fraction. This is a non-obvious convention that affects consumer code.
- README does not document that `ChartContainer` without `label` emits no `role="img"` (intentional decorative behavior).
- README does not document `Sparkline`'s default `label="Sparkline"` — consumers need to be reminded to provide descriptive labels.
- README does not document `Axis` key uniqueness requirement (duplicate label strings produce non-unique React keys).
- Helper API edge cases (empty palette fallback behavior) are undocumented.

---

## Backward Compatibility Findings

DS-006 is fully backward-compatible with DS-001 through DS-005 and CAP-001 through CAP-008.

- All DS-002/DS-003/DS-004/DS-005 exports intact: 43 prior tests pass ✅
- DS-001 exports unchanged: 9 shared tests pass ✅
- Domain tests: 31 files / 285 tests pass ✅
- Application tests: 34 files / 211 tests pass ✅
- No runtime, governance, database, or business capability behavior modified ✅

---

## Future Slice Readiness

| Slice | Readiness |
|---|---|
| DS-007 Accessibility | ✅ — `role="img"` + `aria-label` on chart surfaces; `aria-hidden` on decorative SVG; required `label` on `StatusIndicator`; `Legend` list semantics is the main DS-007 item |
| DS-008 Theme & Branding | ✅ — all visualization colors sourced from `nextShiftThemeTokens.chart.*` and `color.*`; DS-001 token replacement flows automatically through all DS-006 surfaces |

---

## Issues Found

### BLOCKER

None.

### HIGH

None.

### MEDIUM

**M-001**  
**Location:** `packages/ui/test/data-visualization.test.tsx:144–149`  
**Finding:** The `formatChartValue` and `formatPercent` test assertions rely on the runtime environment's default system locale:
```ts
expect(formatChartValue(1234.567, { maximumFractionDigits: 1 })).toBe("1,234.6");
expect(formatChartValue(12, { prefix: "$", suffix: "k" })).toBe("$12k");
expect(formatPercent(12.345)).toBe("12.3%");
```
`formatChartValue` uses `new Intl.NumberFormat(options.locale, ...)`. When `options.locale` is undefined, `Intl.NumberFormat` uses the Node.js process locale. In a `de_DE` environment, `1234.567` formats as `"1.234,6"`, not `"1,234.6"`, and the test fails. CI images (GitHub Actions `ubuntu-latest`, many container images) may use `C`, `POSIX`, or non-US locales. The `$12k` test passes regardless (no number formatting affected by locale for integer `12`), and `formatPercent(12.345)` would produce `"12,3%"` in German locale.  
**Recommendation:** Add `locale: "en-US"` to the `formatChartValue` calls within the test assertions, or configure the test environment's locale via Node.js `--icu-data-dir` / `LANG=en_US.UTF-8`. The function itself is correct — only the tests need locale pinning.

### LOW

**L-001**  
**Location:** `packages/ui/src/visualization/color-scale.ts:6` + `packages/ui/src/visualization/color-scale.ts:11`  
**Finding:** `getCategoricalColor(index)` uses `palette[index % palette.length]`. If `palette.length === 0` (an empty categorical palette), `index % 0 = NaN`, and `palette[NaN]` returns `undefined`. `getSequentialColor(index)` uses `palette[Math.max(0, Math.min(index, palette.length - 1))]`; if `palette.length === 0`, `length - 1 = -1` and `palette[-1]` returns `undefined`. In practice, DS-001 `chart.categorical` has length > 4 and `chart.sequential` is defined, so this is not a current risk. However, a future DS-001 token refactor could inadvertently produce empty palettes, causing silent `undefined` colors downstream.  
**Recommendation:** Add a defensive fallback: `if (palette.length === 0) return theme.color.mutedForeground`. Low urgency; can be bundled with DS-007 or a future DS-006 patch.

**L-002**  
**Location:** `packages/ui/src/visualization/formatting.ts:15` + docs  
**Finding:** `formatPercent(value)` treats `value` as already in percent form (e.g., `12.345` → `"12.3%"`), not as a [0, 1] fraction (e.g., `0.12345` → `"12.3%"`). This convention is non-obvious and not documented in the function signature, README, or test. In SaaS dashboards, both conventions are common. A consumer passing a [0, 1] fraction will silently get a very small percentage displayed.  
**Recommendation:** Add a JSDoc comment to `formatPercent`: `/** @param value - Already in percent form. E.g., 12.5 renders as "12.5%", not 0.125. */`. Add to the README's helper section. Low urgency.

**L-003**  
**Location:** `packages/ui/src/visualization/legend.tsx:27–35`  
**Finding:** Legend items are rendered as `<span>` elements inside a `<div>` container with no list semantics:
```tsx
<div ...>
  {items.map((item, index) => (
    <span key={...}>
      <span aria-hidden="true" .../> {item.label}
    </span>
  ))}
</div>
```
A legend is conceptually a list of labeled series items. Screen readers encountering a sequence of `<span>` elements do not announce group membership or item count. Using `<ul role="list" aria-label="Chart legend">` + `<li>` elements would allow screen readers to announce "list, 4 items" and navigate by item.  
**Recommendation:** Change Legend to render `<ul aria-label="Chart legend">` (or `aria-label={props["aria-label"]}` if the consumer provides one) with `<li>` items. Deferred to DS-007 accessibility hardening.

### NOTE

**N-001**  
**Location:** `packages/ui/src/visualization/axis.tsx:24–28`  
**Finding:** `Axis` merges `getAxisStyle()` with hardcoded inline layout properties:
```tsx
style={mergeStyles(
  getAxisStyle(),
  {
    display: "flex",
    flexDirection: orientation === "horizontal" ? "row" : "column",
    justifyContent: "space-between",
  },
  style
)}
```
These orientation-dependent properties could be extracted to `getAxisStyle(orientation)` in `visualization-styles.ts`. Consistent with prior DS-003/DS-005 patterns. Minor.

**N-002**  
**Location:** `packages/ui/src/visualization/axis.tsx:33` — `key={label}`  
**Finding:** `Axis` uses `key={label}` for each label span. If `labels` contains duplicate strings (e.g., two data points at the same X label), React issues a key uniqueness warning. Using `key={\`${label}-${index}\`}` (as `Legend` does) would prevent this. Minor; low consumer impact.

**N-003**  
**Location:** `packages/ui/src/visualization/sparkline.tsx:9`  
**Finding:** `Sparkline` defaults `label="Sparkline"` — a generic accessible name. When multiple sparklines appear in a dashboard grid (a common pattern), all unlabeled sparklines are announced as "Sparkline" with no differentiation. While the default prevents an unnamed image landmark, consumers should provide descriptive labels like "Revenue trend, last 30 days". The README example shows a labeled usage but does not call out the default.  
**Recommendation:** Consider changing the default to `""` and omitting `role="img"` when `label` is absent (matching `ChartContainer`'s pattern), or document the expectation that consumers always provide a label.

**N-004**  
**Location:** `packages/ui/src/visualization/visualization-loading-state.tsx:17`  
**Finding:** `VisualizationLoadingState` composes `DashboardLoadingState`, which inherits the nested `role="status"` issue (DS-004 L-001, DS-005 L-001). The outer `DashboardLoadingState` renders `<div role="status">` containing `<Spinner>` which also renders `role="status"`. `VisualizationLoadingState` wraps that, adding a third layer. Not a DS-006 regression — carry-forward from DS-004. Resolve in DS-007 batch fix.

---

## Required Fixes Before Release

None. The MEDIUM finding (M-001) affects test reliability in non-US locale CI environments. Since the current CI appears to use a US-compatible locale (Codex reports all tests pass), this is not a current blocker. However, the risk should be addressed before running in diverse CI environments. Recommend fixing as a patch alongside a DS-007 release.

---

## Recommended Follow-ups

1. **(DS-006 test patch)** Pin `locale: "en-US"` in `formatChartValue` test calls — resolves M-001. One-line change per assertion.
2. **(DS-006 docs / patch)** Add JSDoc comment to `formatPercent` documenting the already-in-percent convention — resolves L-002.
3. **(DS-006 patch / DS-007)** Add defensive empty-palette fallback to `getCategoricalColor` and `getSequentialColor` — resolves L-001.
4. **(DS-007)** Change `Legend` to render `<ul>` + `<li>` for proper list semantics — resolves L-003.
5. **(DS-007)** Fix nested `role="status"` in `DashboardLoadingState` (DS-004 L-001) — `VisualizationLoadingState` inherits the fix automatically.
6. **(DS-006 minor)** Change `Axis` key from `key={label}` to `key={\`${label}-${index}\`}` — resolves N-002.
7. **(DS-006 docs)** Document: `ChartContainer` emits no `role` without `label`; `Sparkline` default label is "Sparkline"; `formatPercent` expects percent-form values.
8. **(DS-007)** Consider aligning `Sparkline`'s label behavior with `ChartContainer` (omit role when label absent) — resolves N-003.

---

## Final Recommendation

**DS-006 Data Visualization is production-ready. Proceed to Verification and Release.**

The implementation is correctly scoped, token-driven from DS-001 chart primitives, well-composed from prior DS slices, and backward-compatible. The Sparkline SVG path builder handles edge cases correctly. The accessibility baseline is appropriate for a visualization infrastructure layer. The MEDIUM finding is a test-environment concern rather than a runtime defect. All LOWs and NOTEs are forward-looking items suitable for DS-007 or minor patches.
