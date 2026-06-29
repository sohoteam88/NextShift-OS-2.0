import { nextShiftThemeTokens } from "@nextshift/shared";
import type * as React from "react";
import type {
  ContainerPadding,
  ContainerSize,
  GridColumns,
  LayoutAlign,
  LayoutDensity,
  LayoutGap,
  LayoutJustify,
  LayoutMode,
  PageHeaderVariant,
  SectionSpacing,
  SplitPanelRatio,
} from "../types";
import { mergeStyles } from "./component-styles";

const theme = nextShiftThemeTokens;

const gapMap: Record<LayoutGap, string> = {
  xs: theme.spacing["2"],
  sm: theme.spacing["3"],
  md: theme.spacing["4"],
  lg: theme.spacing["6"],
  xl: theme.spacing["8"],
};

const densityPadding: Record<LayoutDensity, string> = {
  compact: theme.spacing["4"],
  comfortable: theme.spacing["6"],
  spacious: theme.spacing["8"],
};

const paddingMap: Record<ContainerPadding, string> = {
  none: theme.spacing["0"],
  sm: theme.spacing["3"],
  md: theme.spacing["6"],
  lg: theme.spacing["8"],
};

const maxWidthMap: Record<ContainerSize, string> = {
  sm: theme.breakpoint.sm,
  md: theme.breakpoint.md,
  lg: theme.breakpoint.lg,
  xl: theme.breakpoint.xl,
  full: "100%",
};

const alignMap: Record<LayoutAlign, React.CSSProperties["alignItems"]> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  stretch: "stretch",
};

const justifyMap: Record<LayoutJustify, React.CSSProperties["justifyContent"]> =
  {
    start: "flex-start",
    center: "center",
    end: "flex-end",
    between: "space-between",
    around: "space-around",
    evenly: "space-evenly",
  };

const splitRatioMap: Record<SplitPanelRatio, string> = {
  "1:1": "minmax(0, 1fr) minmax(0, 1fr)",
  "2:1": "minmax(0, 2fr) minmax(0, 1fr)",
  "1:2": "minmax(0, 1fr) minmax(0, 2fr)",
  "3:2": "minmax(0, 3fr) minmax(0, 2fr)",
};

export const layoutResponsiveCss = `@media (max-width: ${theme.breakpoint.md}) {
  [data-nextshift-layout="app-shell"],
  [data-nextshift-layout="split-panel"] {
    grid-template-columns: minmax(0, 1fr) !important;
  }

  [data-nextshift-layout-sidebar="true"] {
    position: relative !important;
    width: 100% !important;
    min-height: auto !important;
  }
}`;

export function resolveLayoutGap(gap: LayoutGap): string {
  return gapMap[gap];
}

export function getAppShellStyle(
  sidebarCollapsed: boolean,
  mode: LayoutMode
): React.CSSProperties {
  const sidebarWidth = sidebarCollapsed
    ? theme.spacing["16"]
    : `calc(${theme.spacing["32"]} * 2)`;

  return {
    background: theme.color.background,
    color: theme.color.foreground,
    display: "grid",
    fontFamily: theme.typography.fontFamily.sans,
    gridTemplateAreas: '"header header" "sidebar main" "footer footer"',
    gridTemplateColumns: `${sidebarWidth} minmax(0, 1fr)`,
    gridTemplateRows: "auto minmax(0, 1fr) auto",
    minHeight: "100vh",
    width: "100%",
    ...(mode === "responsive"
      ? { maxWidth: "100%", overflowX: "hidden" }
      : undefined),
  };
}

export function getAppShellSlotStyle(
  slot: "header" | "sidebar" | "main" | "footer"
): React.CSSProperties {
  const base = { gridArea: slot } satisfies React.CSSProperties;

  if (slot === "main") {
    return mergeStyles(base, {
      minWidth: 0,
      overflow: "auto",
    });
  }

  return base;
}

export function getPageShellStyle(density: LayoutDensity): React.CSSProperties {
  return {
    display: "grid",
    gap: densityPadding[density],
    padding: densityPadding[density],
  };
}

export function getHeaderStyle(
  sticky: boolean,
  height: "sm" | "md" | "lg"
): React.CSSProperties {
  const heights = {
    sm: theme.spacing["12"],
    md: theme.spacing["16"],
    lg: theme.spacing["20"],
  };

  return {
    alignItems: "center",
    background: theme.color.surface,
    borderBottom: `1px solid ${theme.color.border}`,
    display: "grid",
    gap: theme.spacing["4"],
    gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)",
    minHeight: heights[height],
    paddingInline: theme.spacing["6"],
    position: sticky ? "sticky" : undefined,
    top: sticky ? 0 : undefined,
    zIndex: sticky ? theme.zIndex.sticky : theme.zIndex.base,
  };
}

export function getSidebarStyle(
  collapsed: boolean,
  sticky: boolean
): React.CSSProperties {
  return {
    background: theme.color.surface,
    borderRight: `1px solid ${theme.color.border}`,
    display: "grid",
    gap: theme.spacing["4"],
    gridTemplateRows: "auto minmax(0, 1fr) auto",
    minHeight: "100%",
    overflow: "hidden",
    padding: collapsed ? theme.spacing["3"] : theme.spacing["4"],
    position: sticky ? "sticky" : undefined,
    top: sticky ? 0 : undefined,
    width: collapsed ? theme.spacing["16"] : `calc(${theme.spacing["32"]} * 2)`,
    zIndex: sticky ? theme.zIndex.sticky : theme.zIndex.base,
  };
}

export function getMainContentStyle(
  maxWidth: ContainerSize | undefined,
  scrollable: boolean
): React.CSSProperties {
  return {
    marginInline: "auto",
    maxWidth: maxWidth ? maxWidthMap[maxWidth] : undefined,
    minWidth: 0,
    overflow: scrollable ? "auto" : undefined,
    padding: theme.spacing["6"],
    width: "100%",
  };
}

export function getContainerStyle(
  size: ContainerSize,
  padding: ContainerPadding,
  center: boolean
): React.CSSProperties {
  return {
    boxSizing: "border-box",
    marginInline: center ? "auto" : undefined,
    maxWidth: maxWidthMap[size],
    paddingInline: paddingMap[padding],
    width: "100%",
  };
}

export function getStackStyle(
  gap: LayoutGap,
  align: LayoutAlign,
  justify: LayoutJustify,
  fullWidth: boolean
): React.CSSProperties {
  return {
    alignItems: alignMap[align],
    display: "flex",
    flexDirection: "column",
    gap: gapMap[gap],
    justifyContent: justifyMap[justify],
    width: fullWidth ? "100%" : undefined,
  };
}

export function getInlineStyle(
  gap: LayoutGap,
  align: LayoutAlign,
  justify: LayoutJustify,
  wrap: boolean,
  fullWidth: boolean
): React.CSSProperties {
  return {
    alignItems: alignMap[align],
    display: "flex",
    flexDirection: "row",
    flexWrap: wrap ? "wrap" : "nowrap",
    gap: gapMap[gap],
    justifyContent: justifyMap[justify],
    width: fullWidth ? "100%" : undefined,
  };
}

export function getGridStyle(
  columns: GridColumns,
  gap: LayoutGap,
  minColumnWidth: string
): React.CSSProperties {
  return {
    display: "grid",
    gap: gapMap[gap],
    gridTemplateColumns:
      columns === "auto"
        ? `repeat(auto-fit, minmax(${minColumnWidth}, 1fr))`
        : `repeat(${columns}, minmax(0, 1fr))`,
  };
}

export function getSplitPanelStyle(
  ratio: SplitPanelRatio,
  gap: LayoutGap
): React.CSSProperties {
  return {
    display: "grid",
    gap: gapMap[gap],
    gridTemplateColumns: splitRatioMap[ratio],
  };
}

export function getSectionStyle(spacing: SectionSpacing): React.CSSProperties {
  return {
    display: "grid",
    gap: densityPadding[spacing],
  };
}

export function getSectionHeaderStyle(): React.CSSProperties {
  return {
    alignItems: "flex-start",
    display: "flex",
    gap: theme.spacing["4"],
    justifyContent: "space-between",
  };
}

export function getPageHeaderStyle(
  variant: PageHeaderVariant
): React.CSSProperties {
  const base: React.CSSProperties = {
    display: "grid",
    gap: theme.spacing["2"],
  };

  if (variant === "split") {
    return mergeStyles(base, {
      alignItems: "start",
      gridTemplateColumns: "minmax(0, 1fr) auto",
    });
  }

  if (variant === "stacked") {
    return mergeStyles(base, {
      justifyItems: "start",
    });
  }

  return base;
}

export function getPageTitleStyle(): React.CSSProperties {
  return {
    color: theme.color.foreground,
    fontFamily: theme.typography.fontFamily.sans,
    fontSize: theme.typography.scale.heading.h2.fontSize,
    fontWeight: theme.typography.scale.heading.h2.fontWeight,
    lineHeight: theme.typography.scale.heading.h2.lineHeight,
    margin: 0,
  };
}

export function getPageDescriptionStyle(): React.CSSProperties {
  return {
    color: theme.color.mutedForeground,
    fontFamily: theme.typography.fontFamily.sans,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.normal,
    margin: 0,
  };
}
