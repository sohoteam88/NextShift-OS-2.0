# DS-006 Data Visualization

## Purpose

DS-006 extends `@nextshift/ui` with reusable data visualization infrastructure. It provides chart containers, cards, legends, axes, grid lines, metric displays, sparklines, status indicators, visualization states, color scale helpers, and formatting utilities.

## Primitives And Helpers

- `ChartContainer`
- `ChartCard`
- `Legend`
- `Axis`
- `GridLines`
- `MetricCard`
- `Sparkline`
- `StatusIndicator`
- `VisualizationEmptyState`
- `VisualizationLoadingState`
- Color scale helpers
- Chart formatting utilities

## Token Model

Visualization styles consume DS-001 chart tokens, including categorical palettes, sequential palettes, positive/negative/neutral indicators, grid, axis, and tooltip slots.

## Composition Model

DS-006 reuses DS-002 components, DS-003 layouts, DS-004 dashboard primitives, and DS-005 loading/interaction primitives where appropriate. It does not implement business analytics logic.

## Accessibility Baseline

- Chart containers can expose an accessible label with `role="img"`.
- Sparkline renders as an accessible SVG image with a label.
- Decorative axes and grid lines are hidden from assistive technology.
- Empty and loading states reuse existing accessible dashboard/interaction primitives.

## Non-Goals

DS-006 does not implement business charts, analytics logic, data fetching, backend APIs, persistence, routing, or a charting dependency.

## Example Usage

```tsx
import { ChartCard, ChartContainer, Sparkline } from "@nextshift/ui";

export function VisualizationExample() {
  return (
    <ChartCard title="Revenue">
      <ChartContainer label="Revenue trend">
        <Sparkline points={[{ x: 0, y: 10 }, { x: 1, y: 14 }]} tone="positive" />
      </ChartContainer>
    </ChartCard>
  );
}
```
