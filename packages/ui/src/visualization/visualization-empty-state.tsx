import * as React from "react";
import { getVisualizationStateStyle, mergeStyles } from "../styles";
import { DashboardEmptyState } from "../dashboard";

export interface VisualizationEmptyStateProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  readonly title: React.ReactNode;
  readonly description?: React.ReactNode;
  readonly action?: React.ReactNode;
}

export function VisualizationEmptyState({
  title,
  description,
  action,
  className,
  style,
  ...props
}: VisualizationEmptyStateProps): React.ReactElement {
  return (
    <DashboardEmptyState
      title={title}
      description={description}
      action={action}
      className={className}
      data-nextshift-visualization="empty-state"
      style={mergeStyles(getVisualizationStateStyle(), style)}
      {...props}
    />
  );
}
