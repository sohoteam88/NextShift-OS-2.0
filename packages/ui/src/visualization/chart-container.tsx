import * as React from "react";
import { getChartContainerStyle, mergeStyles } from "../styles";
import type { ChartContainerAspect } from "../types";

export interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly aspect?: ChartContainerAspect;
  readonly label?: string;
  readonly children: React.ReactNode;
}

export function ChartContainer({
  aspect = "wide",
  label,
  children,
  className,
  style,
  ...props
}: ChartContainerProps): React.ReactElement {
  return (
    <div
      role={label ? "img" : undefined}
      aria-label={label}
      className={className}
      data-nextshift-visualization="chart-container"
      data-aspect={aspect}
      style={mergeStyles(getChartContainerStyle(aspect), style)}
      {...props}
    >
      {children}
    </div>
  );
}
