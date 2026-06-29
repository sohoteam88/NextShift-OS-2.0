import { nextShiftThemeTokens } from "@nextshift/shared";
import type * as React from "react";
import { mergeStyles, visuallyHiddenStyle } from "./component-styles";

const theme = nextShiftThemeTokens;

export function getVisuallyHiddenStyle(): React.CSSProperties {
  return { ...visuallyHiddenStyle };
}

export function getSkipLinkStyle(focused = false): React.CSSProperties {
  return focused
    ? {
        background: theme.color.surface,
        border: `1px solid ${theme.color.info}`,
        borderRadius: theme.radius.md,
        boxShadow: theme.elevation.md,
        color: theme.color.foreground,
        left: theme.spacing["4"],
        paddingBlock: theme.spacing["2"],
        paddingInline: theme.spacing["3"],
        position: "fixed",
        top: theme.spacing["4"],
        zIndex: theme.zIndex.modal,
      }
    : getVisuallyHiddenStyle();
}

export function getLiveRegionStyle(visible = false): React.CSSProperties {
  return visible
    ? {
        color: theme.color.foreground,
        fontFamily: theme.typography.fontFamily.sans,
        fontSize: theme.typography.fontSize.sm,
        lineHeight: theme.typography.lineHeight.normal,
      }
    : getVisuallyHiddenStyle();
}

export function getHighContrastOutlineStyle(
  enabled = true
): React.CSSProperties {
  return enabled
    ? {
        outlineColor: theme.color.foreground,
        outlineOffset: theme.state.focus.outlineOffset,
        outlineStyle: "solid",
        outlineWidth: theme.state.focus.outlineWidth,
      }
    : {};
}

export function getAccessibleFocusStyle(
  highContrast = false
): React.CSSProperties {
  return mergeStyles(
    {
      outlineColor: highContrast ? theme.color.foreground : theme.color.info,
      outlineOffset: theme.state.focus.outlineOffset,
      outlineStyle: "solid",
      outlineWidth: theme.state.focus.outlineWidth,
    },
    highContrast
      ? {
          boxShadow: `0 0 0 ${theme.state.focus.outlineWidth} ${theme.color.background}`,
        }
      : undefined
  );
}
