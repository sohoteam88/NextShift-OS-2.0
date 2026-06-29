import {
  componentTokens,
  nextShiftThemeTokens,
  semanticTokens,
} from "@nextshift/shared";
import type * as React from "react";
import type {
  AlertVariant,
  BadgeVariant,
  ButtonVariant,
  CardVariant,
  ComponentSize,
} from "../types";

const theme = nextShiftThemeTokens;

export const nextShiftUiKeyframes =
  "@keyframes nextshift-ui-spin { to { transform: rotate(360deg); } }";

export const visuallyHiddenStyle: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
};

export function mergeStyles(
  ...styles: ReadonlyArray<React.CSSProperties | undefined>
): React.CSSProperties {
  return Object.assign({}, ...styles);
}

export function getButtonStyle(
  variant: ButtonVariant,
  size: ComponentSize,
  disabled: boolean
): React.CSSProperties {
  const token =
    variant === "ghost"
      ? componentTokens.button.secondary
      : componentTokens.button[variant];
  const sizes: Record<ComponentSize, React.CSSProperties> = {
    sm: {
      minHeight: "2rem",
      paddingInline: theme.spacing["3"],
      paddingBlock: theme.spacing["1"],
      fontSize: theme.typography.fontSize.xs,
    },
    md: {
      minHeight: "2.5rem",
      paddingInline: theme.spacing["4"],
      paddingBlock: theme.spacing["2"],
      fontSize: theme.typography.fontSize.sm,
    },
    lg: {
      minHeight: "2.75rem",
      paddingInline: theme.spacing["5"],
      paddingBlock: theme.spacing["3"],
      fontSize: theme.typography.fontSize.base,
    },
  };

  const variantStyle: Record<ButtonVariant, React.CSSProperties> = {
    primary: {
      background: componentTokens.button.primary.background,
      color: componentTokens.button.primary.foreground,
      borderColor: componentTokens.button.primary.background,
    },
    secondary: {
      background: componentTokens.button.secondary.background,
      color: componentTokens.button.secondary.foreground,
      borderColor: theme.color.border,
    },
    ghost: {
      background: "transparent",
      color: theme.color.mutedForeground,
      borderColor: "transparent",
      boxShadow: theme.elevation.none,
    },
    danger: {
      background: componentTokens.button.danger.background,
      color: componentTokens.button.danger.foreground,
      borderColor: componentTokens.button.danger.background,
    },
  };

  return mergeStyles(
    {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: token.gap,
      borderRadius: token.radius,
      borderWidth: 1,
      borderStyle: "solid",
      boxShadow: theme.elevation.xs,
      fontFamily: theme.typography.fontFamily.sans,
      fontWeight: theme.typography.fontWeight.medium,
      lineHeight: theme.typography.lineHeight.none,
      letterSpacing: theme.typography.letterSpacing.normal,
      transitionDuration: theme.motion.duration.fast,
      transitionTimingFunction: theme.motion.easing.standard,
      transitionProperty: "background-color, border-color, color, opacity",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? theme.state.disabled.opacity : 1,
    },
    variantStyle[variant],
    sizes[size]
  );
}

export function getFieldStyle(
  size: ComponentSize,
  invalid: boolean,
  disabled: boolean
): React.CSSProperties {
  const sizes: Record<ComponentSize, React.CSSProperties> = {
    sm: {
      minHeight: "2rem",
      paddingInline: theme.spacing["2"],
      paddingBlock: theme.spacing["1"],
      fontSize: theme.typography.fontSize.sm,
    },
    md: {
      minHeight: "2.5rem",
      paddingInline: theme.spacing["3"],
      paddingBlock: theme.spacing["2"],
      fontSize: theme.typography.fontSize.sm,
    },
    lg: {
      minHeight: "2.75rem",
      paddingInline: theme.spacing["4"],
      paddingBlock: theme.spacing["3"],
      fontSize: theme.typography.fontSize.base,
    },
  };

  return mergeStyles(
    {
      width: "100%",
      boxSizing: "border-box",
      borderRadius: componentTokens.input.radius,
      borderWidth: 1,
      borderStyle: "solid",
      borderColor: invalid
        ? componentTokens.input.borderError
        : componentTokens.input.border,
      background: disabled ? theme.color.surfaceMuted : componentTokens.input.background,
      color: componentTokens.input.foreground,
      fontFamily: theme.typography.fontFamily.sans,
      lineHeight: theme.typography.lineHeight.normal,
      outlineColor: invalid ? theme.color.danger : componentTokens.input.borderFocus,
      opacity: disabled ? theme.state.disabled.opacity : 1,
      cursor: disabled ? "not-allowed" : "text",
    },
    sizes[size]
  );
}

export function getFieldWrapperStyle(): React.CSSProperties {
  return {
    display: "grid",
    gap: theme.spacing["1"],
  };
}

export function getLabelStyle(): React.CSSProperties {
  return {
    color: theme.color.foreground,
    fontFamily: theme.typography.fontFamily.sans,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    lineHeight: theme.typography.lineHeight.normal,
  };
}

export function getHelperTextStyle(invalid: boolean): React.CSSProperties {
  return {
    color: invalid ? theme.color.danger : theme.color.mutedForeground,
    fontFamily: theme.typography.fontFamily.sans,
    fontSize: theme.typography.fontSize.xs,
    lineHeight: theme.typography.lineHeight.normal,
  };
}

export function getCardStyle(variant: CardVariant): React.CSSProperties {
  return {
    background: componentTokens.card.background,
    color: componentTokens.card.foreground,
    borderColor: componentTokens.card.border,
    borderRadius: componentTokens.card.radius,
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow:
      variant === "elevated" ? componentTokens.card.shadow : theme.elevation.none,
    fontFamily: theme.typography.fontFamily.sans,
    overflow: "hidden",
  };
}

export function getCardSectionStyle(section: "header" | "body" | "footer") {
  return {
    padding: componentTokens.card.padding,
    borderTop:
      section === "footer" ? `1px solid ${theme.color.border}` : undefined,
    borderBottom:
      section === "header" ? `1px solid ${theme.color.border}` : undefined,
  } satisfies React.CSSProperties;
}

export function getBadgeStyle(
  variant: BadgeVariant,
  size: Exclude<ComponentSize, "lg">
): React.CSSProperties {
  const variants: Record<BadgeVariant, React.CSSProperties> = {
    neutral: {
      background: componentTokens.badge.default.background,
      color: componentTokens.badge.default.foreground,
    },
    primary: {
      background: semanticTokens.color.primary,
      color: semanticTokens.color.primaryForeground,
    },
    success: {
      background: componentTokens.badge.success.background,
      color: componentTokens.badge.success.foreground,
    },
    warning: {
      background: componentTokens.badge.warning.background,
      color: componentTokens.badge.warning.foreground,
    },
    danger: {
      background: componentTokens.badge.danger.background,
      color: componentTokens.badge.danger.foreground,
    },
    info: {
      background: semanticTokens.color.info,
      color: semanticTokens.color.infoForeground,
    },
  };
  const sizes: Record<Exclude<ComponentSize, "lg">, React.CSSProperties> = {
    sm: {
      paddingInline: theme.spacing["2"],
      paddingBlock: "0.125rem",
      fontSize: theme.typography.fontSize.xs,
    },
    md: {
      paddingInline: theme.spacing["3"],
      paddingBlock: theme.spacing["1"],
      fontSize: theme.typography.fontSize.sm,
    },
  };

  return mergeStyles(
    {
      display: "inline-flex",
      alignItems: "center",
      borderRadius: componentTokens.badge.default.radius,
      fontFamily: theme.typography.fontFamily.sans,
      fontWeight: theme.typography.fontWeight.medium,
      lineHeight: theme.typography.lineHeight.none,
      whiteSpace: "nowrap",
    },
    variants[variant],
    sizes[size]
  );
}

export function getAlertStyle(variant: AlertVariant): React.CSSProperties {
  const variants: Record<AlertVariant, React.CSSProperties> = {
    info: {
      background: theme.color.info,
      color: theme.color.infoForeground,
      borderColor: theme.color.info,
    },
    success: {
      background: theme.color.success,
      color: theme.color.successForeground,
      borderColor: theme.color.success,
    },
    warning: {
      background: theme.color.warning,
      color: theme.color.warningForeground,
      borderColor: theme.color.warning,
    },
    danger: {
      background: theme.color.danger,
      color: theme.color.dangerForeground,
      borderColor: theme.color.danger,
    },
  };

  return mergeStyles(
    {
      borderRadius: theme.radius.md,
      borderStyle: "solid",
      borderWidth: 1,
      display: "grid",
      gap: theme.spacing["1"],
      fontFamily: theme.typography.fontFamily.sans,
      padding: theme.spacing["4"],
    },
    variants[variant]
  );
}

export function getTableStyle(): React.CSSProperties {
  return {
    width: "100%",
    borderCollapse: "collapse",
    color: componentTokens.table.foreground,
    fontFamily: theme.typography.fontFamily.sans,
    fontSize: theme.typography.fontSize.sm,
  };
}

export function getTableCellStyle(kind: "head" | "cell"): React.CSSProperties {
  return {
    borderBottom: `1px solid ${componentTokens.table.border}`,
    paddingBlock: theme.spacing["3"],
    paddingInline: theme.spacing["4"],
    textAlign: "left",
    background:
      kind === "head"
        ? componentTokens.table.headerBackground
        : componentTokens.table.rowBackground,
    fontWeight:
      kind === "head"
        ? theme.typography.fontWeight.semibold
        : theme.typography.fontWeight.regular,
  };
}

export function getSpinnerStyle(size: ComponentSize): React.CSSProperties {
  const sizes: Record<ComponentSize, string> = {
    sm: "1rem",
    md: "1.25rem",
    lg: "2rem",
  };

  return {
    display: "inline-block",
    width: sizes[size],
    height: sizes[size],
    borderRadius: theme.radius.full,
    borderWidth: size === "lg" ? 4 : 2,
    borderStyle: "solid",
    borderColor: "currentColor",
    borderTopColor: "transparent",
    color: theme.color.primary,
    animation: `nextshift-ui-spin ${theme.motion.duration.slow} ${theme.motion.easing.standard} infinite`,
  };
}

export function getEmptyStateStyle(): React.CSSProperties {
  return {
    alignItems: "center",
    background: theme.color.background,
    border: `1px dashed ${theme.color.border}`,
    borderRadius: theme.radius.lg,
    color: theme.color.foreground,
    display: "flex",
    flexDirection: "column",
    fontFamily: theme.typography.fontFamily.sans,
    gap: theme.spacing["2"],
    justifyContent: "center",
    minHeight: "16rem",
    padding: theme.spacing["8"],
    textAlign: "center",
  };
}
