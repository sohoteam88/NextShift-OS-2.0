import * as React from "react";
import { getDashboardGridStyle, mergeStyles } from "../styles";
import type { DashboardGridColumns, LayoutGap } from "../types";

export interface DashboardGridProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly columns?: DashboardGridColumns;
  readonly gap?: LayoutGap;
  readonly minColumnWidth?: string;
}

export function DashboardGrid({
  columns = "auto",
  gap = "md",
  minColumnWidth = "18rem",
  className,
  style,
  children,
  ...props
}: DashboardGridProps): React.ReactElement {
  return (
    <div
      className={className}
      data-nextshift-dashboard="grid"
      data-columns={columns}
      style={mergeStyles(getDashboardGridStyle(columns, gap, minColumnWidth), style)}
      {...props}
    >
      {children}
    </div>
  );
}
