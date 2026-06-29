import * as React from "react";
import { getVisualizationStateStyle, mergeStyles } from "../styles";
import { DashboardLoadingState } from "../dashboard";

export interface VisualizationLoadingStateProps
  extends React.HTMLAttributes<HTMLDivElement> {
  readonly label?: string;
}

export function VisualizationLoadingState({
  label = "Loading visualization",
  className,
  style,
  ...props
}: VisualizationLoadingStateProps): React.ReactElement {
  return (
    <DashboardLoadingState
      label={label}
      className={className}
      data-nextshift-visualization="loading-state"
      style={mergeStyles(getVisualizationStateStyle(), style)}
      {...props}
    />
  );
}
