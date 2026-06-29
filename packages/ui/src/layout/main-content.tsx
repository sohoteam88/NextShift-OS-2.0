import * as React from "react";
import { getMainContentStyle, mergeStyles } from "../styles";
import type { ContainerSize } from "../types";

export interface MainContentProps extends React.HTMLAttributes<HTMLElement> {
  readonly maxWidth?: ContainerSize;
  readonly scrollable?: boolean;
  readonly children: React.ReactNode;
}

export function MainContent({
  maxWidth,
  scrollable = false,
  children,
  className,
  style,
  ...props
}: MainContentProps): React.ReactElement {
  return (
    <main
      className={className}
      style={mergeStyles(getMainContentStyle(maxWidth, scrollable), style)}
      {...props}
    >
      {children}
    </main>
  );
}
