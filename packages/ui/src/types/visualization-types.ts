export type VisualizationTone = "positive" | "negative" | "neutral" | "info";
export type ChartContainerAspect = "wide" | "square" | "compact";
export type MetricTrend = "up" | "down" | "flat";

export interface LegendItem {
  readonly label: string;
  readonly color?: string;
}

export interface SparklinePoint {
  readonly x: number;
  readonly y: number;
}

export interface ChartValueFormatOptions {
  readonly locale?: string;
  readonly maximumFractionDigits?: number;
  readonly minimumFractionDigits?: number;
  readonly prefix?: string;
  readonly suffix?: string;
}
