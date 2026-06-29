import * as React from "react";
import { getToolbarStyle, mergeStyles } from "../styles";

export interface DashboardToolbarProps
  extends React.HTMLAttributes<HTMLDivElement> {
  readonly leading?: React.ReactNode;
  readonly trailing?: React.ReactNode;
  readonly children?: React.ReactNode;
}

export function DashboardToolbar({
  leading,
  trailing,
  children,
  className,
  style,
  ...props
}: DashboardToolbarProps): React.ReactElement {
  return (
    <div
      className={className}
      data-nextshift-dashboard="toolbar"
      style={mergeStyles(getToolbarStyle(), style)}
      {...props}
    >
      <div>{leading ?? children}</div>
      {trailing ? <div>{trailing}</div> : null}
    </div>
  );
}
