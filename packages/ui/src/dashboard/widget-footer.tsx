import * as React from "react";
import { getWidgetFooterStyle, mergeStyles } from "../styles";

export interface WidgetFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly children: React.ReactNode;
}

export function WidgetFooter({
  children,
  className,
  style,
  ...props
}: WidgetFooterProps): React.ReactElement {
  return (
    <div
      className={className}
      data-nextshift-dashboard="widget-footer"
      style={mergeStyles(getWidgetFooterStyle(), style)}
      {...props}
    >
      {children}
    </div>
  );
}
