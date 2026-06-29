import * as React from "react";
import { getChartCardStyle, mergeStyles } from "../styles";
import { WidgetBody, WidgetContainer, WidgetFooter, WidgetHeader } from "../dashboard";

export interface ChartCardProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  readonly title?: React.ReactNode;
  readonly description?: React.ReactNode;
  readonly actions?: React.ReactNode;
  readonly footer?: React.ReactNode;
  readonly children: React.ReactNode;
}

export function ChartCard({
  title,
  description,
  actions,
  footer,
  children,
  className,
  style,
  ...props
}: ChartCardProps): React.ReactElement {
  return (
    <WidgetContainer
      className={className}
      data-nextshift-visualization="chart-card"
      style={mergeStyles(getChartCardStyle(), style)}
      {...props}
    >
      {title || description || actions ? (
        <WidgetHeader title={title} description={description} actions={actions} />
      ) : null}
      <WidgetBody>{children}</WidgetBody>
      {footer ? <WidgetFooter>{footer}</WidgetFooter> : null}
    </WidgetContainer>
  );
}
