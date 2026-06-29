import type * as React from "react";

export type ComponentSize = "sm" | "md" | "lg";
export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type BadgeVariant =
  | "neutral"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info";
export type AlertVariant = "info" | "success" | "warning" | "danger";
export type CardVariant = "bordered" | "elevated";

export interface SelectOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
}

export interface BaseComponentProps {
  readonly className?: string;
  readonly style?: React.CSSProperties;
}
