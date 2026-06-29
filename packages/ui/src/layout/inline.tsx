import * as React from "react";
import { getInlineStyle, mergeStyles } from "../styles";
import type { LayoutAlign, LayoutGap, LayoutJustify } from "../types";

export interface InlineProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly gap?: LayoutGap;
  readonly align?: LayoutAlign;
  readonly justify?: LayoutJustify;
  readonly wrap?: boolean;
  readonly fullWidth?: boolean;
}

export function Inline({
  gap = "md",
  align = "center",
  justify = "start",
  wrap = false,
  fullWidth = false,
  className,
  style,
  children,
  ...props
}: InlineProps): React.ReactElement {
  return (
    <div
      className={className}
      data-gap={gap}
      style={mergeStyles(
        getInlineStyle(gap, align, justify, wrap, fullWidth),
        style
      )}
      {...props}
    >
      {children}
    </div>
  );
}
