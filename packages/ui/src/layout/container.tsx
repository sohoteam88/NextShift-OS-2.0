import * as React from "react";
import { getContainerStyle, mergeStyles } from "../styles";
import type { ContainerPadding, ContainerSize } from "../types";

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly size?: ContainerSize;
  readonly padding?: ContainerPadding;
  readonly center?: boolean;
}

export function Container({
  size = "lg",
  padding = "md",
  center = true,
  className,
  style,
  children,
  ...props
}: ContainerProps): React.ReactElement {
  return (
    <div
      className={className}
      data-size={size}
      data-padding={padding}
      style={mergeStyles(getContainerStyle(size, padding, center), style)}
      {...props}
    >
      {children}
    </div>
  );
}
