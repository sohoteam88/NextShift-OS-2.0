import * as React from "react";
import {
  getMetricCardStyle,
  getMetricTrendStyle,
  getMetricValueStyle,
  getWidgetDescriptionStyle,
  getWidgetTitleStyle,
  mergeStyles,
} from "../styles";
import type { MetricTrend } from "../types";

export interface MetricCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  readonly label: React.ReactNode;
  readonly value: React.ReactNode;
  readonly trend?: MetricTrend;
  readonly trendLabel?: React.ReactNode;
  readonly description?: React.ReactNode;
}

export function MetricCard({
  label,
  value,
  trend = "flat",
  trendLabel,
  description,
  className,
  style,
  ...props
}: MetricCardProps): React.ReactElement {
  return (
    <div
      className={className}
      data-nextshift-visualization="metric-card"
      style={mergeStyles(getMetricCardStyle(), style)}
      {...props}
    >
      <span style={getWidgetTitleStyle()}>{label}</span>
      <p style={getMetricValueStyle()}>{value}</p>
      {trendLabel ? <span style={getMetricTrendStyle(trend)}>{trendLabel}</span> : null}
      {description ? (
        <span style={getWidgetDescriptionStyle()}>{description}</span>
      ) : null}
    </div>
  );
}
