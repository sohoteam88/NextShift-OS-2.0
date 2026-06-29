import * as React from "react";
import { getDropdownStyle, mergeStyles } from "../styles";
import type { DropdownAlign } from "../types";

export interface DropdownProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly trigger: React.ReactNode;
  readonly open?: boolean;
  readonly align?: DropdownAlign;
  readonly menuLabel?: string;
  readonly children: React.ReactNode;
}

export function Dropdown({
  trigger,
  open = false,
  align = "start",
  menuLabel = "Dropdown menu",
  children,
  className,
  style,
  ...props
}: DropdownProps): React.ReactElement {
  const triggerWithAria = React.isValidElement(trigger)
    ? React.cloneElement(
        trigger as React.ReactElement<React.HTMLAttributes<HTMLElement>>,
        {
          "aria-expanded": open,
          "aria-haspopup": "menu",
        }
      )
    : trigger;

  return (
    <div
      className={className}
      data-nextshift-interaction="dropdown"
      style={mergeStyles({ display: "inline-grid", position: "relative" }, style)}
      {...props}
    >
      <div>{triggerWithAria}</div>
      {open ? (
        <div role="menu" aria-label={menuLabel} style={getDropdownStyle(align)}>
          {children}
        </div>
      ) : null}
    </div>
  );
}
