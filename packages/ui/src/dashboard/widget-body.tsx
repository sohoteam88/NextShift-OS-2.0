import * as React from "react";
import { getWidgetBodyStyle, mergeStyles } from "../styles";

export interface WidgetBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly children: React.ReactNode;
}

export function WidgetBody({
  children,
  className,
  style,
  ...props
}: WidgetBodyProps): React.ReactElement {
  return (
    <div
      className={className}
      data-nextshift-dashboard="widget-body"
      style={mergeStyles(getWidgetBodyStyle(), style)}
      {...props}
    >
      {children}
    </div>
  );
}
