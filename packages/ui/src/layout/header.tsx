import * as React from "react";
import { getHeaderStyle, mergeStyles } from "../styles";

export interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  readonly leading?: React.ReactNode;
  readonly center?: React.ReactNode;
  readonly trailing?: React.ReactNode;
  readonly sticky?: boolean;
  readonly height?: "sm" | "md" | "lg";
}

export function Header({
  leading,
  center,
  trailing,
  sticky = false,
  height = "md",
  className,
  style,
  children,
  ...props
}: HeaderProps): React.ReactElement {
  return (
    <header
      className={className}
      data-sticky={sticky || undefined}
      style={mergeStyles(getHeaderStyle(sticky, height), style)}
      {...props}
    >
      <div>{leading ?? children}</div>
      <div>{center}</div>
      <div style={{ justifySelf: "end" }}>{trailing}</div>
    </header>
  );
}
