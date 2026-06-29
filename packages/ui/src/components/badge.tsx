import * as React from "react";
import { getBadgeStyle, mergeStyles } from "../styles";
import type { BadgeVariant } from "../types";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  readonly variant?: BadgeVariant;
  readonly size?: "sm" | "md";
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    { variant = "neutral", size = "md", className, style, children, ...props },
    ref
  ) => (
    <span
      ref={ref}
      className={className}
      data-variant={variant}
      data-size={size}
      style={mergeStyles(getBadgeStyle(variant, size), style)}
      {...props}
    >
      {children}
    </span>
  )
);

Badge.displayName = "Badge";
