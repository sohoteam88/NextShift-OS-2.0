import { componentTokens, nextShiftThemeTokens } from "@nextshift/shared";
import type * as React from "react";
import type {
  DashboardDensity,
  DashboardGridColumns,
  DashboardPanelVariant,
  LayoutGap,
  WidgetStatus,
} from "../types";
import { mergeStyles } from "./component-styles";
import { resolveLayoutGap } from "./layout-styles";

const theme = nextShiftThemeTokens;

const densityGap: Record<DashboardDensity, LayoutGap> = {
  compact: "sm",
  comfortable: "md",
  spacious: "lg",
};

const densityPadding: Record<DashboardDensity, string> = {
  compact: theme.spacing["4"],
  comfortable: theme.spacing["6"],
  spacious: theme.spacing["8"],
};

const statusBorder: Record<WidgetStatus, string> = {
  default: theme.color.border,
  success: theme.color.success,
  warning: theme.color.warning,
  danger: theme.color.danger,
  info: theme.color.info,
};

export function getDashboardShellStyle(
  density: DashboardDensity
): React.CSSProperties {
  return {
    background: theme.color.background,
    color: theme.color.foreground,
    display: "grid",
    fontFamily: theme.typography.fontFamily.sans,
    gap: resolveLayoutGap(densityGap[density]),
    minHeight: "100%",
    padding: densityPadding[density],
  };
}

export function getDashboardPageStyle(
  density: DashboardDensity
): React.CSSProperties {
  return {
    display: "grid",
    gap: resolveLayoutGap(densityGap[density]),
    width: "100%",
  };
}

export function getDashboardGridStyle(
  columns: DashboardGridColumns,
  gap: LayoutGap,
  minColumnWidth: string
): React.CSSProperties {
  return {
    display: "grid",
    gap: resolveLayoutGap(gap),
    gridTemplateColumns:
      columns === "auto"
        ? `repeat(auto-fit, minmax(${minColumnWidth}, 1fr))`
        : `repeat(${columns}, minmax(0, 1fr))`,
    width: "100%",
  };
}

export function getDashboardPanelStyle(
  variant: DashboardPanelVariant,
  density: DashboardDensity
): React.CSSProperties {
  return {
    background:
      variant === "plain" ? "transparent" : componentTokens.card.background,
    border:
      variant === "plain" ? undefined : `1px solid ${componentTokens.card.border}`,
    borderRadius: variant === "plain" ? undefined : componentTokens.card.radius,
    boxShadow:
      variant === "elevated" ? componentTokens.card.shadow : theme.elevation.none,
    color: theme.color.foreground,
    display: "grid",
    gap: resolveLayoutGap(densityGap[density]),
    padding: variant === "plain" ? undefined : densityPadding[density],
  };
}

export function getWidgetContainerStyle(
  status: WidgetStatus
): React.CSSProperties {
  return {
    background: componentTokens.card.background,
    border: `1px solid ${statusBorder[status]}`,
    borderRadius: componentTokens.card.radius,
    boxShadow: componentTokens.card.shadow,
    color: componentTokens.card.foreground,
    display: "grid",
    minWidth: 0,
    overflow: "hidden",
  };
}

export function getWidgetHeaderStyle(): React.CSSProperties {
  return {
    alignItems: "start",
    borderBottom: `1px solid ${theme.color.border}`,
    display: "flex",
    gap: theme.spacing["4"],
    justifyContent: "space-between",
    padding: theme.spacing["4"],
  };
}

export function getWidgetBodyStyle(): React.CSSProperties {
  return {
    minWidth: 0,
    padding: theme.spacing["4"],
  };
}

export function getWidgetFooterStyle(): React.CSSProperties {
  return {
    alignItems: "center",
    borderTop: `1px solid ${theme.color.border}`,
    color: theme.color.mutedForeground,
    display: "flex",
    gap: theme.spacing["3"],
    justifyContent: "space-between",
    padding: theme.spacing["3"],
  };
}

export function getToolbarStyle(): React.CSSProperties {
  return {
    alignItems: "center",
    background: theme.color.surface,
    border: `1px solid ${theme.color.border}`,
    borderRadius: theme.radius.lg,
    display: "flex",
    flexWrap: "wrap",
    gap: theme.spacing["3"],
    justifyContent: "space-between",
    padding: theme.spacing["3"],
  };
}

export function getDashboardFilterBarStyle(): React.CSSProperties {
  return mergeStyles(getToolbarStyle(), {
    background: theme.color.surfaceMuted,
  });
}

export function getDashboardStateStyle(): React.CSSProperties {
  return {
    alignItems: "center",
    background: theme.color.surface,
    border: `1px dashed ${theme.color.border}`,
    borderRadius: theme.radius.lg,
    color: theme.color.mutedForeground,
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing["3"],
    justifyContent: "center",
    minHeight: "14rem",
    padding: theme.spacing["8"],
    textAlign: "center",
  };
}

export function getWidgetTitleStyle(): React.CSSProperties {
  return {
    color: theme.color.foreground,
    fontFamily: theme.typography.fontFamily.sans,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    lineHeight: theme.typography.lineHeight.normal,
    margin: 0,
  };
}

export function getWidgetDescriptionStyle(): React.CSSProperties {
  return {
    color: theme.color.mutedForeground,
    fontFamily: theme.typography.fontFamily.sans,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.normal,
    margin: 0,
  };
}
