import * as React from "react";
import { getTooltipStyle, mergeStyles } from "../styles";

export interface TooltipProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "content"> {
  readonly content: React.ReactNode;
  readonly open?: boolean;
  readonly children: React.ReactNode;
}

export function Tooltip({
  content,
  open = false,
  children,
  className,
  style,
  ...props
}: TooltipProps): React.ReactElement {
  const tooltipId = React.useId();

  return (
    <span
      className={className}
      data-nextshift-interaction="tooltip"
      style={mergeStyles({ display: "inline-grid", position: "relative" }, style)}
      {...props}
    >
      <span aria-describedby={open ? tooltipId : undefined}>{children}</span>
      {open ? (
        <span id={tooltipId} role="tooltip" style={getTooltipStyle()}>
          {content}
        </span>
      ) : null}
    </span>
  );
}
