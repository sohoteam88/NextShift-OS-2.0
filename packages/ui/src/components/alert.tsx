import * as React from "react";
import { getAlertStyle, mergeStyles } from "../styles";
import type { AlertVariant } from "../types";

export interface AlertProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  readonly variant?: AlertVariant;
  readonly title?: React.ReactNode;
  readonly children?: React.ReactNode;
}

export function Alert({
  variant = "info",
  title,
  children,
  className,
  style,
  role,
  ...props
}: AlertProps): React.ReactElement {
  return (
    <div
      role={role ?? (variant === "danger" ? "alert" : "status")}
      className={className}
      data-variant={variant}
      style={mergeStyles(getAlertStyle(variant), style)}
      {...props}
    >
      {title ? <strong>{title}</strong> : null}
      {children ? <div>{children}</div> : null}
    </div>
  );
}
