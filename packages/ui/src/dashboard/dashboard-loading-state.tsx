import * as React from "react";
import { getDashboardStateStyle, mergeStyles } from "../styles";
import { Spinner } from "../components";

export interface DashboardLoadingStateProps
  extends React.HTMLAttributes<HTMLDivElement> {
  readonly label?: string;
}

export function DashboardLoadingState({
  label = "Loading dashboard",
  className,
  style,
  ...props
}: DashboardLoadingStateProps): React.ReactElement {
  return (
    <div
      role="status"
      aria-label={label}
      className={className}
      data-nextshift-dashboard="loading-state"
      style={mergeStyles(getDashboardStateStyle(), style)}
      {...props}
    >
      <Spinner label={label} />
      <span>{label}</span>
    </div>
  );
}
