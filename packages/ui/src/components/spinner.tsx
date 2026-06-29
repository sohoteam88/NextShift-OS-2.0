import * as React from "react";
import {
  getSpinnerStyle,
  mergeStyles,
  nextShiftUiKeyframes,
  visuallyHiddenStyle,
} from "../styles";
import type { ComponentSize } from "../types";

export interface SpinnerProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  readonly size?: ComponentSize;
  readonly label?: string;
}

export function Spinner({
  size = "md",
  label = "Loading",
  className,
  style,
  ...props
}: SpinnerProps): React.ReactElement {
  return (
    <span
      role="status"
      aria-label={label}
      className={className}
      style={mergeStyles(getSpinnerStyle(size), style)}
      {...props}
    >
      <style>{nextShiftUiKeyframes}</style>
      <span style={visuallyHiddenStyle}>{label}</span>
    </span>
  );
}
