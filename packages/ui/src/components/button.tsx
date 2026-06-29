import * as React from "react";
import { getButtonStyle, mergeStyles } from "../styles";
import type { ButtonVariant, ComponentSize } from "../types";
import { Spinner } from "./spinner";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly size?: ComponentSize;
  readonly loading?: boolean;
  readonly loadingLabel?: string;
  readonly icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      loadingLabel = "Loading",
      icon,
      disabled,
      children,
      className,
      style,
      type = "button",
      ...props
    },
    ref
  ) => {
    const isDisabled = Boolean(disabled || loading);

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={className}
        data-variant={variant}
        data-size={size}
        style={mergeStyles(getButtonStyle(variant, size, isDisabled), style)}
        {...props}
      >
        {loading ? (
          <Spinner size="sm" label={loadingLabel} aria-hidden="true" />
        ) : (
          icon
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
