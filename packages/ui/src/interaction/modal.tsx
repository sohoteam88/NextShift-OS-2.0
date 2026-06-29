import * as React from "react";
import {
  getModalBackdropStyle,
  getModalSurfaceStyle,
  getWidgetTitleStyle,
  mergeStyles,
} from "../styles";
import type { ModalSize } from "../types";
import { Button } from "../components";

export interface ModalProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  readonly open?: boolean;
  readonly title?: React.ReactNode;
  readonly footer?: React.ReactNode;
  readonly size?: ModalSize;
  readonly closeLabel?: string;
  readonly onClose?: () => void;
  readonly children: React.ReactNode;
}

export function Modal({
  open = true,
  title,
  footer,
  size = "md",
  closeLabel = "Close",
  onClose,
  children,
  className,
  style,
  ...props
}: ModalProps): React.ReactElement | null {
  const titleId = React.useId();

  if (!open) {
    return null;
  }

  return (
    <div
      role="presentation"
      data-nextshift-interaction="modal-backdrop"
      style={getModalBackdropStyle()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={className}
        data-nextshift-interaction="modal"
        style={mergeStyles(getModalSurfaceStyle(size), style)}
        {...props}
      >
        {title || onClose ? (
          <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
            {title ? (
              <h2 id={titleId} style={getWidgetTitleStyle()}>
                {title}
              </h2>
            ) : null}
            {onClose ? (
              <Button variant="ghost" size="sm" onClick={onClose}>
                {closeLabel}
              </Button>
            ) : null}
          </div>
        ) : null}
        <div>{children}</div>
        {footer ? <footer>{footer}</footer> : null}
      </div>
    </div>
  );
}
