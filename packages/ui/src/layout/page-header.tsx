import * as React from "react";
import {
  getPageDescriptionStyle,
  getPageHeaderStyle,
  getPageTitleStyle,
  mergeStyles,
} from "../styles";
import type { PageHeaderVariant } from "../types";

export interface PageHeaderProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  readonly title: React.ReactNode;
  readonly description?: React.ReactNode;
  readonly eyebrow?: React.ReactNode;
  readonly actions?: React.ReactNode;
  readonly metadata?: React.ReactNode;
  readonly variant?: PageHeaderVariant;
  readonly headingLevel?: 1 | 2 | 3;
}

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  metadata,
  variant = "default",
  headingLevel = 1,
  className,
  style,
  ...props
}: PageHeaderProps): React.ReactElement {
  const Heading = `h${headingLevel}` as "h1" | "h2" | "h3";

  return (
    <div
      className={className}
      data-variant={variant}
      style={mergeStyles(getPageHeaderStyle(variant), style)}
      {...props}
    >
      <div>
        {eyebrow ? <div>{eyebrow}</div> : null}
        <Heading style={getPageTitleStyle()}>{title}</Heading>
        {description ? (
          <p style={getPageDescriptionStyle()}>{description}</p>
        ) : null}
        {metadata ? <div>{metadata}</div> : null}
      </div>
      {actions ? <div>{actions}</div> : null}
    </div>
  );
}
