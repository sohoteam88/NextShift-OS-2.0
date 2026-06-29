import * as React from "react";
import {
  getProgressBarStyle,
  getProgressTrackStyle,
  mergeStyles,
} from "../styles";
import type { InteractionTone, ProgressMode } from "../types";

export interface ProgressIndicatorProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  readonly value?: number;
  readonly max?: number;
  readonly mode?: ProgressMode;
  readonly tone?: InteractionTone;
  readonly label?: string;
}

export function ProgressIndicator({
  value = 0,
  max = 100,
  mode = "determinate",
  tone = "info",
  label = "Progress",
  className,
  style,
  ...props
}: ProgressIndicatorProps): React.ReactElement {
  const percent = max > 0 ? Math.round((value / max) * 100) : 0;

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={mode === "determinate" ? 0 : undefined}
      aria-valuemax={mode === "determinate" ? max : undefined}
      aria-valuenow={mode === "determinate" ? value : undefined}
      className={className}
      data-mode={mode}
      data-nextshift-interaction="progress"
      style={mergeStyles(getProgressTrackStyle(), style)}
      {...props}
    >
      <div style={getProgressBarStyle(mode, percent, tone)} />
    </div>
  );
}
