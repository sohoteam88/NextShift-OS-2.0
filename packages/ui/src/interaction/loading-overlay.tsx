import * as React from "react";
import {
  getInteractionSpinnerStyle,
  getLoadingOverlayStyle,
  mergeStyles,
} from "../styles";
import type { InteractionSize, InteractionTone, OverlayPlacement } from "../types";
import { Spinner } from "../components";

export interface LoadingOverlayProps
  extends React.HTMLAttributes<HTMLDivElement> {
  readonly visible?: boolean;
  readonly label?: string;
  readonly placement?: OverlayPlacement;
  readonly size?: InteractionSize;
  readonly tone?: InteractionTone;
}

export function LoadingOverlay({
  visible = true,
  label = "Loading",
  placement = "center",
  size = "md",
  tone = "info",
  className,
  style,
  ...props
}: LoadingOverlayProps): React.ReactElement | null {
  if (!visible) {
    return null;
  }

  return (
    <div
      role="status"
      aria-label={label}
      className={className}
      data-nextshift-interaction="loading-overlay"
      style={mergeStyles(getLoadingOverlayStyle(placement), style)}
      {...props}
    >
      <Spinner
        size={size}
        label={label}
        style={getInteractionSpinnerStyle(size, tone)}
      />
      <span>{label}</span>
    </div>
  );
}
