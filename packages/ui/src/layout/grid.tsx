import * as React from "react";
import { getGridStyle, mergeStyles } from "../styles";
import type { GridColumns, LayoutGap } from "../types";

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly columns?: GridColumns;
  readonly gap?: LayoutGap;
  readonly minColumnWidth?: string;
}

export function Grid({
  columns = 1,
  gap = "md",
  minColumnWidth = "16rem",
  className,
  style,
  children,
  ...props
}: GridProps): React.ReactElement {
  return (
    <div
      className={className}
      data-columns={columns}
      data-gap={gap}
      style={mergeStyles(getGridStyle(columns, gap, minColumnWidth), style)}
      {...props}
    >
      {children}
    </div>
  );
}
