import * as React from "react";
import { getDashboardPanelStyle, mergeStyles } from "../styles";
import type { DashboardDensity, DashboardPanelVariant } from "../types";

export interface DashboardPanelProps
  extends React.HTMLAttributes<HTMLElement> {
  readonly variant?: DashboardPanelVariant;
  readonly density?: DashboardDensity;
  readonly children: React.ReactNode;
}

export function DashboardPanel({
  variant = "bordered",
  density = "comfortable",
  children,
  className,
  style,
  ...props
}: DashboardPanelProps): React.ReactElement {
  return (
    <section
      className={className}
      data-nextshift-dashboard="panel"
      data-variant={variant}
      style={mergeStyles(getDashboardPanelStyle(variant, density), style)}
      {...props}
    >
      {children}
    </section>
  );
}
