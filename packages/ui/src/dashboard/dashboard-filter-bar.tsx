import * as React from "react";
import { getDashboardFilterBarStyle, mergeStyles } from "../styles";

export interface DashboardFilterBarProps
  extends React.HTMLAttributes<HTMLDivElement> {
  readonly filters?: React.ReactNode;
  readonly actions?: React.ReactNode;
  readonly children?: React.ReactNode;
}

export function DashboardFilterBar({
  filters,
  actions,
  children,
  className,
  style,
  ...props
}: DashboardFilterBarProps): React.ReactElement {
  return (
    <div
      className={className}
      data-nextshift-dashboard="filter-bar"
      style={mergeStyles(getDashboardFilterBarStyle(), style)}
      {...props}
    >
      <div>{filters ?? children}</div>
      {actions ? <div>{actions}</div> : null}
    </div>
  );
}
