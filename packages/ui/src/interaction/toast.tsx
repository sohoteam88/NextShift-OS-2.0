import * as React from "react";
import {
  getToastStyle,
  getWidgetDescriptionStyle,
  getWidgetTitleStyle,
  mergeStyles,
} from "../styles";
import type { InteractionTone } from "../types";
import { Button } from "../components";

export interface ToastProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  readonly tone?: InteractionTone;
  readonly title?: React.ReactNode;
  readonly description?: React.ReactNode;
  readonly action?: React.ReactNode;
  readonly dismissLabel?: string;
  readonly onDismiss?: () => void;
}

export function Toast({
  tone = "neutral",
  title,
  description,
  action,
  dismissLabel = "Dismiss",
  onDismiss,
  className,
  style,
  children,
  ...props
}: ToastProps): React.ReactElement {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={className}
      data-nextshift-interaction="toast"
      data-tone={tone}
      style={mergeStyles(getToastStyle(tone), style)}
      {...props}
    >
      {title ? <strong style={getWidgetTitleStyle()}>{title}</strong> : null}
      {description ? (
        <p style={getWidgetDescriptionStyle()}>{description}</p>
      ) : null}
      {children}
      {action || onDismiss ? (
        <div>
          {action}
          {onDismiss ? (
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              {dismissLabel}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
