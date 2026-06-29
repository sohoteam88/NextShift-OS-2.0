import * as React from "react";
import {
  getSplitPanelStyle,
  layoutResponsiveCss,
  mergeStyles,
} from "../styles";
import type { LayoutGap, SplitPanelRatio } from "../types";

export interface SplitPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly primary: React.ReactNode;
  readonly secondary: React.ReactNode;
  readonly ratio?: SplitPanelRatio;
  readonly gap?: LayoutGap;
  readonly collapseOnSmall?: boolean;
}

export function SplitPanel({
  primary,
  secondary,
  ratio = "1:1",
  gap = "lg",
  collapseOnSmall = true,
  className,
  style,
  ...props
}: SplitPanelProps): React.ReactElement {
  return (
    <div
      className={className}
      data-nextshift-layout={collapseOnSmall ? "split-panel" : undefined}
      data-ratio={ratio}
      style={mergeStyles(getSplitPanelStyle(ratio, gap), style)}
      {...props}
    >
      {collapseOnSmall ? <style>{layoutResponsiveCss}</style> : null}
      <div>{primary}</div>
      <div>{secondary}</div>
    </div>
  );
}
