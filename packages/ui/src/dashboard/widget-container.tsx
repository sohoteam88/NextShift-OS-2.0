import * as React from "react";
import { getWidgetContainerStyle, mergeStyles } from "../styles";
import type { WidgetStatus } from "../types";

export interface WidgetContainerProps
  extends React.HTMLAttributes<HTMLElement> {
  readonly status?: WidgetStatus;
  readonly children: React.ReactNode;
}

export function WidgetContainer({
  status = "default",
  children,
  className,
  style,
  ...props
}: WidgetContainerProps): React.ReactElement {
  return (
    <section
      className={className}
      data-nextshift-dashboard="widget"
      data-status={status}
      style={mergeStyles(getWidgetContainerStyle(status), style)}
      {...props}
    >
      {children}
    </section>
  );
}
