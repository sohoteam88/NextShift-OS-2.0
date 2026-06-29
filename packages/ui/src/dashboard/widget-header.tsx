import * as React from "react";
import {
  getWidgetDescriptionStyle,
  getWidgetHeaderStyle,
  getWidgetTitleStyle,
  mergeStyles,
} from "../styles";

export interface WidgetHeaderProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  readonly title?: React.ReactNode;
  readonly description?: React.ReactNode;
  readonly actions?: React.ReactNode;
}

export function WidgetHeader({
  title,
  description,
  actions,
  children,
  className,
  style,
  ...props
}: WidgetHeaderProps): React.ReactElement {
  return (
    <div
      className={className}
      data-nextshift-dashboard="widget-header"
      style={mergeStyles(getWidgetHeaderStyle(), style)}
      {...props}
    >
      <div>
        {title ? <h3 style={getWidgetTitleStyle()}>{title}</h3> : null}
        {description ? (
          <p style={getWidgetDescriptionStyle()}>{description}</p>
        ) : null}
        {children}
      </div>
      {actions ? <div>{actions}</div> : null}
    </div>
  );
}
