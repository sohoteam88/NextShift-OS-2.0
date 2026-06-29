import { componentTokens, nextShiftThemeTokens } from "@nextshift/shared";
import type * as React from "react";
import type {
  ChartContainerAspect,
  MetricTrend,
  VisualizationTone,
} from "../types";

const theme = nextShiftThemeTokens;

const aspectMap: Record<ChartContainerAspect, string> = {
  wide: "16 / 9",
  square: "1 / 1",
  compact: "3 / 1",
};

const toneColor: Record<VisualizationTone, string> = {
  positive: theme.chart.positive,
  negative: theme.chart.negative,
  neutral: theme.chart.neutral,
  info: theme.color.info,
};

const trendTone: Record<MetricTrend, VisualizationTone> = {
  up: "positive",
  down: "negative",
  flat: "neutral",
};

export function getChartContainerStyle(
  aspect: ChartContainerAspect
): React.CSSProperties {
  return {
    aspectRatio: aspectMap[aspect],
    background: theme.color.surface,
    border: `1px solid ${theme.color.border}`,
    borderRadius: theme.radius.lg,
    color: theme.color.foreground,
    display: "grid",
    minHeight: 0,
    minWidth: 0,
    overflow: "hidden",
    padding: theme.spacing["4"],
    width: "100%",
  };
}

export function getChartCardStyle(): React.CSSProperties {
  return {
    background: componentTokens.card.background,
    border: `1px solid ${componentTokens.card.border}`,
    borderRadius: componentTokens.card.radius,
    boxShadow: componentTokens.card.shadow,
    color: componentTokens.card.foreground,
    display: "grid",
    gap: theme.spacing["4"],
    padding: componentTokens.card.padding,
  };
}

export function getLegendStyle(): React.CSSProperties {
  return {
    alignItems: "center",
    color: theme.color.mutedForeground,
    display: "flex",
    flexWrap: "wrap",
    fontFamily: theme.typography.fontFamily.sans,
    fontSize: theme.typography.fontSize.sm,
    gap: theme.spacing["3"],
  };
}

export function getLegendSwatchStyle(color: string): React.CSSProperties {
  return {
    background: color,
    borderRadius: theme.radius.full,
    display: "inline-block",
    height: theme.spacing["2"],
    width: theme.spacing["2"],
  };
}

export function getAxisStyle(): React.CSSProperties {
  return {
    color: theme.chart.axis,
    fontFamily: theme.typography.fontFamily.sans,
    fontSize: theme.typography.fontSize.xs,
    lineHeight: theme.typography.lineHeight.normal,
  };
}

export function getGridLineStroke(): string {
  return theme.chart.grid;
}

export function getMetricCardStyle(): React.CSSProperties {
  return {
    background: theme.color.surface,
    border: `1px solid ${theme.color.border}`,
    borderRadius: theme.radius.lg,
    boxShadow: theme.elevation.sm,
    color: theme.color.foreground,
    display: "grid",
    gap: theme.spacing["2"],
    padding: theme.spacing["4"],
  };
}

export function getMetricValueStyle(): React.CSSProperties {
  return {
    color: theme.color.foreground,
    fontFamily: theme.typography.fontFamily.sans,
    fontSize: theme.typography.scale.heading.h3.fontSize,
    fontWeight: theme.typography.fontWeight.bold,
    lineHeight: theme.typography.lineHeight.tight,
    margin: 0,
  };
}

export function getMetricTrendStyle(trend: MetricTrend): React.CSSProperties {
  return {
    color: toneColor[trendTone[trend]],
    fontFamily: theme.typography.fontFamily.sans,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  };
}

export function getSparklineStroke(tone: VisualizationTone): string {
  return toneColor[tone];
}

export function getStatusIndicatorStyle(
  tone: VisualizationTone
): React.CSSProperties {
  return {
    alignItems: "center",
    color: toneColor[tone],
    display: "inline-flex",
    fontFamily: theme.typography.fontFamily.sans,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    gap: theme.spacing["2"],
  };
}

export function getStatusDotStyle(tone: VisualizationTone): React.CSSProperties {
  return {
    background: toneColor[tone],
    borderRadius: theme.radius.full,
    display: "inline-block",
    height: theme.spacing["2"],
    width: theme.spacing["2"],
  };
}

export function getVisualizationStateStyle(): React.CSSProperties {
  return {
    alignItems: "center",
    background: theme.color.surface,
    border: `1px dashed ${theme.color.border}`,
    borderRadius: theme.radius.lg,
    color: theme.color.mutedForeground,
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing["3"],
    justifyContent: "center",
    minHeight: "12rem",
    padding: theme.spacing["8"],
    textAlign: "center",
  };
}
