import * as React from "react";
import { getDashboardShellStyle, mergeStyles } from "../styles";
import type { DashboardDensity } from "../types";
import { AppShell, type AppShellProps } from "../layout";

export interface DashboardShellProps
  extends Omit<AppShellProps, "children" | "style"> {
  readonly density?: DashboardDensity;
  readonly children: React.ReactNode;
  readonly style?: React.CSSProperties;
}

export function DashboardShell({
  density = "comfortable",
  children,
  style,
  ...props
}: DashboardShellProps): React.ReactElement {
  return (
    <AppShell
      data-nextshift-dashboard="shell"
      style={mergeStyles(getDashboardShellStyle(density), style)}
      {...props}
    >
      {children}
    </AppShell>
  );
}
