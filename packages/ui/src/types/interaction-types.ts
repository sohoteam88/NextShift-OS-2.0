export type InteractionTone =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "info";
export type InteractionSize = "sm" | "md" | "lg";
export type ProgressMode = "determinate" | "indeterminate";
export type OverlayPlacement = "center" | "top" | "bottom";
export type DropdownAlign = "start" | "center" | "end";
export type ModalSize = "sm" | "md" | "lg" | "xl";
export type KeyboardIntent = "activate" | "cancel" | "navigate-next" | "navigate-previous";

export interface InteractionState {
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly selected?: boolean;
  readonly expanded?: boolean;
  readonly invalid?: boolean;
}
