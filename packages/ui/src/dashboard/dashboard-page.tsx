import * as React from "react";
import { getDashboardPageStyle, mergeStyles } from "../styles";
import type { DashboardDensity, PageHeaderVariant } from "../types";
import { MainContent, PageHeader } from "../layout";

export interface DashboardPageProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  readonly title?: React.ReactNode;
  readonly description?: React.ReactNode;
  readonly actions?: React.ReactNode;
  readonly metadata?: React.ReactNode;
  readonly density?: DashboardDensity;
  readonly headerVariant?: PageHeaderVariant;
  readonly children: React.ReactNode;
}

export function DashboardPage({
  title,
  description,
  actions,
  metadata,
  density = "comfortable",
  headerVariant = "split",
  children,
  className,
  style,
  ...props
}: DashboardPageProps): React.ReactElement {
  return (
    <MainContent>
      <div
        className={className}
        data-nextshift-dashboard="page"
        data-density={density}
        style={mergeStyles(getDashboardPageStyle(density), style)}
        {...props}
      >
        {title ? (
          <PageHeader
            title={title}
            description={description}
            actions={actions}
            metadata={metadata}
            variant={headerVariant}
          />
        ) : null}
        {children}
      </div>
    </MainContent>
  );
}
