import * as React from "react";
import {
  getPageDescriptionStyle,
  getPageTitleStyle,
  getSectionHeaderStyle,
  getSectionStyle,
  mergeStyles,
} from "../styles";
import type { CardVariant, SectionSpacing } from "../types";
import { Card } from "../components";

export interface SectionProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  readonly title?: React.ReactNode;
  readonly description?: React.ReactNode;
  readonly actions?: React.ReactNode;
  readonly spacing?: SectionSpacing;
  readonly asCard?: boolean;
  readonly cardVariant?: CardVariant;
  readonly children: React.ReactNode;
}

export function Section({
  title,
  description,
  actions,
  spacing = "comfortable",
  asCard = false,
  cardVariant = "bordered",
  children,
  className,
  style,
  ...props
}: SectionProps): React.ReactElement {
  const content = (
    <section
      className={className}
      style={mergeStyles(getSectionStyle(spacing), style)}
      {...props}
    >
      {title || description || actions ? (
        <div style={getSectionHeaderStyle()}>
          <div>
            {title ? <h2 style={getPageTitleStyle()}>{title}</h2> : null}
            {description ? (
              <p style={getPageDescriptionStyle()}>{description}</p>
            ) : null}
          </div>
          {actions ? <div>{actions}</div> : null}
        </div>
      ) : null}
      <div>{children}</div>
    </section>
  );

  if (!asCard) {
    return content;
  }

  return <Card variant={cardVariant}>{content}</Card>;
}
