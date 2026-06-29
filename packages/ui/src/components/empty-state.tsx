import * as React from "react";
import { getEmptyStateStyle, mergeStyles } from "../styles";

export interface EmptyStateProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  readonly title: React.ReactNode;
  readonly description?: React.ReactNode;
  readonly action?: React.ReactNode;
  readonly icon?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
  style,
  ...props
}: EmptyStateProps): React.ReactElement {
  return (
    <div
      role="status"
      className={className}
      style={mergeStyles(getEmptyStateStyle(), style)}
      {...props}
    >
      {icon ? <div aria-hidden="true">{icon}</div> : null}
      <strong>{title}</strong>
      {description ? <p>{description}</p> : null}
      {action ? <div>{action}</div> : null}
    </div>
  );
}
