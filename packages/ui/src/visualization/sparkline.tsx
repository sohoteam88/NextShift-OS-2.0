import * as React from "react";
import { getSparklineStroke } from "../styles";
import type { SparklinePoint, VisualizationTone } from "../types";

export interface SparklineProps
  extends Omit<React.SVGAttributes<SVGSVGElement>, "points"> {
  readonly points: readonly SparklinePoint[];
  readonly tone?: VisualizationTone;
  readonly label?: string;
}

function buildSparklinePath(points: readonly SparklinePoint[]): string {
  if (points.length === 0) {
    return "";
  }

  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const xRange = maxX - minX || 1;
  const yRange = maxY - minY || 1;

  return points
    .map((point, index) => {
      const x = ((point.x - minX) / xRange) * 100;
      const y = 100 - ((point.y - minY) / yRange) * 100;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

export function Sparkline({
  points,
  tone = "info",
  label = "Sparkline",
  ...props
}: SparklineProps): React.ReactElement {
  return (
    <svg
      role="img"
      aria-label={label}
      data-nextshift-visualization="sparkline"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      {...props}
    >
      <path
        d={buildSparklinePath(points)}
        fill="none"
        stroke={getSparklineStroke(tone)}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
    </svg>
  );
}
