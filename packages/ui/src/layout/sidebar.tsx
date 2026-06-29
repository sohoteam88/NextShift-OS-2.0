import * as React from "react";
import { getSidebarStyle, mergeStyles } from "../styles";

export interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  readonly header?: React.ReactNode;
  readonly footer?: React.ReactNode;
  readonly collapsed?: boolean;
  readonly sticky?: boolean;
  readonly label?: string;
  readonly children: React.ReactNode;
}

export function Sidebar({
  header,
  footer,
  collapsed = false,
  sticky = false,
  label = "Sidebar",
  children,
  className,
  style,
  ...props
}: SidebarProps): React.ReactElement {
  return (
    <aside
      aria-label={label}
      className={className}
      data-collapsed={collapsed || undefined}
      data-nextshift-layout-sidebar="true"
      style={mergeStyles(getSidebarStyle(collapsed, sticky), style)}
      {...props}
    >
      {header ? <header>{header}</header> : null}
      <div>{children}</div>
      {footer ? <footer>{footer}</footer> : null}
    </aside>
  );
}
