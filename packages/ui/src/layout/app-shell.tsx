import * as React from "react";
import {
  getAppShellSlotStyle,
  getAppShellStyle,
  layoutResponsiveCss,
  mergeStyles,
} from "../styles";
import type { LayoutMode } from "../types";

export interface AppShellProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly header?: React.ReactNode;
  readonly sidebar?: React.ReactNode;
  readonly footer?: React.ReactNode;
  readonly sidebarCollapsed?: boolean;
  readonly layoutMode?: LayoutMode;
  readonly sidebarLabel?: string;
  readonly children: React.ReactNode;
}

export function AppShell({
  header,
  sidebar,
  footer,
  sidebarCollapsed = false,
  layoutMode = "responsive",
  sidebarLabel = "Application sidebar",
  children,
  className,
  style,
  ...props
}: AppShellProps): React.ReactElement {
  return (
    <div
      className={className}
      data-nextshift-layout="app-shell"
      data-layout-mode={layoutMode}
      style={mergeStyles(getAppShellStyle(sidebarCollapsed, layoutMode), style)}
      {...props}
    >
      {layoutMode === "responsive" ? <style>{layoutResponsiveCss}</style> : null}
      {header ? <div style={getAppShellSlotStyle("header")}>{header}</div> : null}
      {sidebar ? (
        <aside
          aria-label={sidebarLabel}
          data-nextshift-layout-sidebar="true"
          style={getAppShellSlotStyle("sidebar")}
        >
          {sidebar}
        </aside>
      ) : null}
      <div style={getAppShellSlotStyle("main")}>{children}</div>
      {footer ? <div style={getAppShellSlotStyle("footer")}>{footer}</div> : null}
    </div>
  );
}
