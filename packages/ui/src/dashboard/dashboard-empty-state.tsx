import * as React from "react";
import { getDashboardStateStyle, mergeStyles } from "../styles";
import { EmptyState } from "../components";

export interface DashboardEmptyStateProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  readonly title: React.ReactNode;
  readonly description?: React.ReactNode;
  readonly action?: React.ReactNode;
  readonly icon?: React.ReactNode;
}

export function DashboardEmptyState({
  title,
  description,
  action,
  icon,
  className,
  style,
  ...props
}: DashboardEmptyStateProps): React.ReactElement {
  return (
    <EmptyState
      title={title}
      description={description}
      action={action}
      icon={icon}
      className={className}
      style={mergeStyles(getDashboardStateStyle(), style)}
      {...props}
    />
  );
}
