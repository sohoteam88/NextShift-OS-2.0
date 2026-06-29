import type * as React from "react";
import type { InteractionState } from "../types";

export function getInteractionStateAttributes(
  state: InteractionState
): React.AriaAttributes & Record<string, string | boolean | undefined> {
  return {
    "aria-busy": state.loading || undefined,
    "aria-disabled": state.disabled || undefined,
    "aria-expanded": state.expanded,
    "aria-invalid": state.invalid || undefined,
    "aria-selected": state.selected,
    "data-disabled": state.disabled || undefined,
    "data-loading": state.loading || undefined,
    "data-selected": state.selected || undefined,
  };
}

export function isInteractionBlocked(state: InteractionState): boolean {
  return Boolean(state.disabled || state.loading);
}
