import { nextShiftThemeTokens } from "@nextshift/shared";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  AppShell,
  Button,
  ChartCard,
  ChartContainer,
  DashboardShell,
  GridLines,
  Legend,
  LoadingOverlay,
  MetricCard,
  Sparkline,
  StatusIndicator,
  VisualizationEmptyState,
  VisualizationLoadingState,
  Axis,
  formatChartValue,
  formatPercent,
  getCategoricalColor,
  getChartContainerStyle,
  getGridLineStroke,
  getSequentialColor,
  getSparklineStroke,
  getToneColor,
  type ChartContainerProps,
  type LegendItem,
  type MetricCardProps,
  type SparklinePoint,
  type VisualizationTone,
} from "../src";

describe("DS-006 data visualization", () => {
  it("exposes visualization components, helpers, and types", () => {
    const tone: VisualizationTone = "positive";
    const points: readonly SparklinePoint[] = [{ x: 0, y: 1 }];
    const legend: readonly LegendItem[] = [{ label: "Revenue" }];
    const containerProps: ChartContainerProps = { children: "Chart" };
    const metricProps: MetricCardProps = { label: "MRR", value: "$1,000" };

    expect(ChartContainer).toBeDefined();
    expect(ChartCard).toBeDefined();
    expect(Legend).toBeDefined();
    expect(Axis).toBeDefined();
    expect(GridLines).toBeDefined();
    expect(MetricCard).toBeDefined();
    expect(Sparkline).toBeDefined();
    expect(StatusIndicator).toBeDefined();
    expect(VisualizationEmptyState).toBeDefined();
    expect(VisualizationLoadingState).toBeDefined();
    expect(tone).toBe("positive");
    expect(points[0].y).toBe(1);
    expect(legend[0].label).toBe("Revenue");
    expect(containerProps.children).toBe("Chart");
    expect(metricProps.label).toBe("MRR");
  });

  it("renders chart container and chart card", () => {
    const markup = renderToStaticMarkup(
      <ChartCard title="Revenue" description="Monthly trend">
        <ChartContainer label="Revenue trend">
          <Sparkline points={[{ x: 0, y: 1 }, { x: 1, y: 3 }]} />
        </ChartContainer>
      </ChartCard>
    );

    expect(markup).toContain('data-nextshift-visualization="chart-card"');
    expect(markup).toContain('data-nextshift-visualization="chart-container"');
    expect(markup).toContain('role="img"');
    expect(markup).toContain('aria-label="Revenue trend"');
    expect(markup).toContain("Monthly trend");
  });

  it("renders legend, axis, and grid lines", () => {
    const markup = renderToStaticMarkup(
      <>
        <Legend items={[{ label: "A" }, { label: "B", color: "#000000" }]} />
        <Axis labels={["Jan", "Feb"]} />
        <GridLines rows={2} columns={2} />
      </>
    );

    expect(markup).toContain('data-nextshift-visualization="legend"');
    expect(markup).toContain("A");
    expect(markup).toContain("B");
    expect(markup).toContain('data-nextshift-visualization="axis"');
    expect(markup).toContain("Jan");
    expect(markup).toContain('data-nextshift-visualization="grid-lines"');
    expect(markup).toContain("<line");
  });

  it("renders metric, sparkline, and status indicator", () => {
    const markup = renderToStaticMarkup(
      <>
        <MetricCard label="Revenue" value="$12,000" trend="up" trendLabel="+12%" />
        <Sparkline
          points={[
            { x: 0, y: 10 },
            { x: 1, y: 20 },
            { x: 2, y: 15 },
          ]}
          tone="positive"
        />
        <StatusIndicator tone="negative" label="At risk" />
      </>
    );

    expect(markup).toContain('data-nextshift-visualization="metric-card"');
    expect(markup).toContain("$12,000");
    expect(markup).toContain("+12%");
    expect(markup).toContain('data-nextshift-visualization="sparkline"');
    expect(markup).toContain("<path");
    expect(markup).toContain('data-nextshift-visualization="status-indicator"');
    expect(markup).toContain("At risk");
  });

  it("renders visualization empty and loading states", () => {
    const markup = renderToStaticMarkup(
      <>
        <VisualizationEmptyState title="No data" description="Connect data later." />
        <VisualizationLoadingState label="Loading chart" />
      </>
    );

    expect(markup).toContain('data-nextshift-visualization="empty-state"');
    expect(markup).toContain("No data");
    expect(markup).toContain('data-nextshift-visualization="loading-state"');
    expect(markup).toContain('aria-label="Loading chart"');
  });

  it("uses DS-001 visualization tokens", () => {
    expect(getCategoricalColor(0)).toBe(nextShiftThemeTokens.chart.categorical[0]);
    expect(getSequentialColor(2)).toBe(nextShiftThemeTokens.chart.sequential[2]);
    expect(getToneColor("positive")).toBe(nextShiftThemeTokens.chart.positive);
    expect(getGridLineStroke()).toBe(nextShiftThemeTokens.chart.grid);
    expect(getSparklineStroke("negative")).toBe(nextShiftThemeTokens.chart.negative);
    expect(getChartContainerStyle("wide").background).toBe(
      nextShiftThemeTokens.color.surface
    );
  });

  it("formats chart values", () => {
    expect(formatChartValue(1234.567, { maximumFractionDigits: 1 })).toBe(
      "1,234.6"
    );
    expect(formatChartValue(12, { prefix: "$", suffix: "k" })).toBe("$12k");
    expect(formatPercent(12.345)).toBe("12.3%");
  });

  it("keeps DS-001 through DS-005 compatibility visible through exports", () => {
    expect(Button).toBeDefined();
    expect(AppShell).toBeDefined();
    expect(DashboardShell).toBeDefined();
    expect(LoadingOverlay).toBeDefined();
    expect(renderToStaticMarkup(<Button>DS-002</Button>)).toContain("DS-002");
    expect(renderToStaticMarkup(<AppShell>DS-003</AppShell>)).toContain(
      "DS-003"
    );
    expect(renderToStaticMarkup(<DashboardShell>DS-004</DashboardShell>)).toContain(
      "DS-004"
    );
    expect(renderToStaticMarkup(<LoadingOverlay label="DS-005" />)).toContain(
      "DS-005"
    );
  });
});
