import * as React from "react";
import { getCardSectionStyle, getCardStyle, mergeStyles } from "../styles";
import type { CardVariant } from "../types";

export interface CardProps extends React.HTMLAttributes<HTMLElement> {
  readonly header?: React.ReactNode;
  readonly footer?: React.ReactNode;
  readonly variant?: CardVariant;
  readonly children: React.ReactNode;
}

export function Card({
  header,
  footer,
  variant = "bordered",
  children,
  className,
  style,
  ...props
}: CardProps): React.ReactElement {
  return (
    <section
      className={className}
      data-variant={variant}
      style={mergeStyles(getCardStyle(variant), style)}
      {...props}
    >
      {header ? <header style={getCardSectionStyle("header")}>{header}</header> : null}
      <div style={getCardSectionStyle("body")}>{children}</div>
      {footer ? <footer style={getCardSectionStyle("footer")}>{footer}</footer> : null}
    </section>
  );
}
