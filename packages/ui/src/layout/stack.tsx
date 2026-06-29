import * as React from "react";
import { getStackStyle, mergeStyles } from "../styles";
import type { LayoutAlign, LayoutGap, LayoutJustify } from "../types";

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly gap?: LayoutGap;
  readonly align?: LayoutAlign;
  readonly justify?: LayoutJustify;
  readonly fullWidth?: boolean;
}

export function Stack({
  gap = "md",
  align = "stretch",
  justify = "start",
  fullWidth = false,
  className,
  style,
  children,
  ...props
}: StackProps): React.ReactElement {
  return (
    <div
      className={className}
      data-gap={gap}
      style={mergeStyles(getStackStyle(gap, align, justify, fullWidth), style)}
      {...props}
    >
      {children}
    </div>
  );
}
