import * as React from "react";
import { getPageShellStyle, mergeStyles } from "../styles";
import type { LayoutDensity } from "../types";

export interface PageShellProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly header?: React.ReactNode;
  readonly actions?: React.ReactNode;
  readonly footer?: React.ReactNode;
  readonly density?: LayoutDensity;
  readonly children: React.ReactNode;
}

export function PageShell({
  header,
  actions,
  footer,
  density = "comfortable",
  children,
  className,
  style,
  ...props
}: PageShellProps): React.ReactElement {
  return (
    <div
      className={className}
      data-density={density}
      style={mergeStyles(getPageShellStyle(density), style)}
      {...props}
    >
      {header || actions ? (
        <div style={{ alignItems: "start", display: "flex", justifyContent: "space-between" }}>
          <div>{header}</div>
          {actions ? <div>{actions}</div> : null}
        </div>
      ) : null}
      <div>{children}</div>
      {footer ? <footer>{footer}</footer> : null}
    </div>
  );
}
