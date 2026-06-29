import type * as React from "react";
import { mergeAccessibleIds } from "./ids";

export function getAriaLabelProps(options: {
  readonly label?: string;
  readonly labelledBy?: string;
}): Pick<React.AriaAttributes, "aria-label" | "aria-labelledby"> {
  return {
    "aria-label": options.label,
    "aria-labelledby": options.labelledBy,
  };
}

export function getAriaDescriptionProps(options: {
  readonly describedBy?: string;
  readonly errorId?: string;
  readonly invalid?: boolean;
}): Pick<React.AriaAttributes, "aria-describedby" | "aria-errormessage"> {
  return {
    "aria-describedby": mergeAccessibleIds(options.describedBy, options.invalid ? options.errorId : undefined),
    "aria-errormessage": options.invalid ? options.errorId : undefined,
  };
}

export function getAriaExpandedProps(
  expanded: boolean,
  controls?: string
): Pick<React.AriaAttributes, "aria-expanded" | "aria-controls"> {
  return {
    "aria-controls": controls,
    "aria-expanded": expanded,
  };
}

export function getAriaPressedProps(
  pressed: boolean
): Pick<React.AriaAttributes, "aria-pressed"> {
  return {
    "aria-pressed": pressed,
  };
}

export function getAriaInvalidProps(
  invalid: boolean,
  errorId?: string
): Pick<React.AriaAttributes, "aria-invalid" | "aria-errormessage"> {
  return {
    "aria-errormessage": invalid ? errorId : undefined,
    "aria-invalid": invalid || undefined,
  };
}

export function getAriaBusyProps(
  busy: boolean
): Pick<React.AriaAttributes, "aria-busy"> {
  return {
    "aria-busy": busy || undefined,
  };
}

export function getDisabledAriaProps(
  disabled: boolean
): Pick<React.AriaAttributes, "aria-disabled"> & { readonly tabIndex?: number } {
  return {
    "aria-disabled": disabled || undefined,
    tabIndex: disabled ? -1 : undefined,
  };
}
