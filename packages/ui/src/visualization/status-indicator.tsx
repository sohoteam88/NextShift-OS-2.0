import * as React from "react";
import {
  getStatusDotStyle,
  getStatusIndicatorStyle,
  mergeStyles,
} from "../styles";
import type { VisualizationTone } from "../types";

export interface StatusIndicatorProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  readonly tone?: VisualizationTone;
  readonly label: React.ReactNode;
}

export function StatusIndicator({
  tone = "neutral",
  label,
  className,
  style,
  ...props
}: StatusIndicatorProps): React.ReactElement {
  return (
    <span
      className={className}
      data-nextshift-visualization="status-indicator"
      data-tone={tone}
      style={mergeStyles(getStatusIndicatorStyle(tone), style)}
      {...props}
    >
      <span aria-hidden="true" style={getStatusDotStyle(tone)} />
      {label}
    </span>
  );
}
