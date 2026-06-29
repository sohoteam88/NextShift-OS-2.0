import * as React from "react";
import {
  getFieldStyle,
  getFieldWrapperStyle,
  getHelperTextStyle,
  getLabelStyle,
  mergeStyles,
} from "../styles";
import type { ComponentSize } from "../types";

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  readonly label?: string;
  readonly helperText?: string;
  readonly error?: string;
  readonly size?: ComponentSize;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      size = "md",
      id,
      name,
      disabled = false,
      required,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const inputId = id ?? name;
    const invalid = Boolean(error || props["aria-invalid"]);
    const helperId = inputId && (error || helperText) ? `${inputId}-hint` : undefined;

    return (
      <label style={getFieldWrapperStyle()}>
        {label ? <span style={getLabelStyle()}>{label}</span> : null}
        <input
          ref={ref}
          id={inputId}
          name={name}
          disabled={disabled}
          required={required}
          aria-invalid={invalid || undefined}
          aria-describedby={helperId}
          className={className}
          data-size={size}
          style={mergeStyles(getFieldStyle(size, invalid, disabled), style)}
          {...props}
        />
        {error || helperText ? (
          <span id={helperId} style={getHelperTextStyle(Boolean(error))}>
            {error ?? helperText}
          </span>
        ) : null}
      </label>
    );
  }
);

Input.displayName = "Input";
