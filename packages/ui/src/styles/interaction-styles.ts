import { nextShiftThemeTokens } from "@nextshift/shared";
import type * as React from "react";
import type {
  DropdownAlign,
  InteractionSize,
  InteractionTone,
  ModalSize,
  OverlayPlacement,
  ProgressMode,
} from "../types";
import { mergeStyles } from "./component-styles";

const theme = nextShiftThemeTokens;

const toneColor: Record<InteractionTone, string> = {
  neutral: theme.color.foreground,
  success: theme.color.success,
  warning: theme.color.warning,
  danger: theme.color.danger,
  info: theme.color.info,
};

const modalWidth: Record<ModalSize, string> = {
  sm: theme.breakpoint.xs,
  md: theme.breakpoint.sm,
  lg: theme.breakpoint.md,
  xl: theme.breakpoint.lg,
};

const spinnerSize: Record<InteractionSize, string> = {
  sm: "1rem",
  md: "1.25rem",
  lg: "2rem",
};

export function getFocusRingStyle(
  tone: InteractionTone = "info"
): React.CSSProperties {
  return {
    outlineColor: toneColor[tone],
    outlineOffset: theme.state.focus.outlineOffset,
    outlineStyle: "solid",
    outlineWidth: theme.state.focus.outlineWidth,
  };
}

export function getMotionTransition(
  properties: readonly string[],
  speed: "fast" | "normal" | "slow" = "normal"
): string {
  return properties
    .map(
      (property) =>
        `${property} ${theme.motion.duration[speed]} ${theme.motion.easing.standard}`
    )
    .join(", ");
}

export function getInteractionStateStyle(options: {
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly selected?: boolean;
  readonly invalid?: boolean;
}): React.CSSProperties {
  return {
    opacity:
      options.disabled || options.loading
        ? theme.state.disabled.opacity
        : options.selected
          ? theme.state.selected.opacity
          : 1,
    cursor: options.disabled || options.loading ? "not-allowed" : undefined,
    outlineColor: options.invalid ? theme.color.danger : undefined,
  };
}

export function getLoadingOverlayStyle(
  placement: OverlayPlacement
): React.CSSProperties {
  const alignment: Record<OverlayPlacement, React.CSSProperties> = {
    center: { alignItems: "center", justifyContent: "center" },
    top: { alignItems: "flex-start", justifyContent: "center" },
    bottom: { alignItems: "flex-end", justifyContent: "center" },
  };

  return mergeStyles(
    {
      background: theme.overlay.background,
      color: theme.color.foreground,
      display: "flex",
      gap: theme.spacing["3"],
      inset: 0,
      padding: theme.spacing["6"],
      position: "absolute",
      zIndex: theme.zIndex.overlay,
    },
    alignment[placement]
  );
}

export function getProgressTrackStyle(): React.CSSProperties {
  return {
    background: theme.color.surfaceMuted,
    borderRadius: theme.radius.full,
    height: theme.spacing["2"],
    overflow: "hidden",
    width: "100%",
  };
}

export function getProgressBarStyle(
  mode: ProgressMode,
  value: number,
  tone: InteractionTone
): React.CSSProperties {
  return {
    background: toneColor[tone],
    borderRadius: theme.radius.full,
    height: "100%",
    transform:
      mode === "determinate"
        ? `scaleX(${Math.max(0, Math.min(100, value)) / 100})`
        : "scaleX(0.38)",
    transformOrigin: "left",
    transition: getMotionTransition(["transform"], "normal"),
    width: "100%",
  };
}

export function getToastStyle(tone: InteractionTone): React.CSSProperties {
  return {
    background: theme.color.surface,
    border: `1px solid ${toneColor[tone]}`,
    borderRadius: theme.radius.lg,
    boxShadow: theme.elevation.lg,
    color: theme.color.foreground,
    display: "grid",
    gap: theme.spacing["2"],
    maxWidth: "24rem",
    padding: theme.spacing["4"],
  };
}

export function getModalBackdropStyle(): React.CSSProperties {
  return {
    alignItems: "center",
    background: theme.overlay.scrim,
    display: "flex",
    inset: 0,
    justifyContent: "center",
    padding: theme.spacing["6"],
    position: "fixed",
    zIndex: theme.zIndex.modal,
  };
}

export function getModalSurfaceStyle(size: ModalSize): React.CSSProperties {
  return {
    background: theme.color.surface,
    border: `1px solid ${theme.color.border}`,
    borderRadius: theme.radius.lg,
    boxShadow: theme.elevation.xl,
    color: theme.color.foreground,
    display: "grid",
    gap: theme.spacing["4"],
    maxWidth: modalWidth[size],
    padding: theme.spacing["6"],
    width: "100%",
  };
}

export function getDropdownStyle(align: DropdownAlign): React.CSSProperties {
  const justifySelf: Record<DropdownAlign, React.CSSProperties["justifySelf"]> =
    {
      start: "start",
      center: "center",
      end: "end",
    };

  return {
    background: theme.color.surface,
    border: `1px solid ${theme.color.border}`,
    borderRadius: theme.radius.md,
    boxShadow: theme.elevation.lg,
    color: theme.color.foreground,
    display: "grid",
    gap: theme.spacing["1"],
    justifySelf: justifySelf[align],
    minWidth: "12rem",
    padding: theme.spacing["2"],
    zIndex: theme.zIndex.dropdown,
  };
}

export function getTooltipStyle(): React.CSSProperties {
  return {
    background: theme.chart.tooltip.background,
    border: `1px solid ${theme.chart.tooltip.border}`,
    borderRadius: theme.radius.sm,
    color: theme.chart.tooltip.foreground,
    fontSize: theme.typography.fontSize.xs,
    lineHeight: theme.typography.lineHeight.normal,
    maxWidth: "16rem",
    paddingBlock: theme.spacing["1"],
    paddingInline: theme.spacing["2"],
    zIndex: theme.zIndex.tooltip,
  };
}

export function getInteractionSpinnerStyle(
  size: InteractionSize,
  tone: InteractionTone
): React.CSSProperties {
  return {
    color: toneColor[tone],
    height: spinnerSize[size],
    width: spinnerSize[size],
  };
}
