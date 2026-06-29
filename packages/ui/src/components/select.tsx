import * as React from "react";
import {
  getFieldStyle,
  getFieldWrapperStyle,
  getHelperTextStyle,
  getLabelStyle,
  mergeStyles,
} from "../styles";
import type { ComponentSize, SelectOption } from "../types";

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  readonly label?: string;
  readonly helperText?: string;
  readonly error?: string;
  readonly placeholder?: string;
  readonly options: readonly SelectOption[];
  readonly size?: ComponentSize;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      helperText,
      error,
      placeholder,
      options,
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
    const selectId = id ?? name;
    const invalid = Boolean(error || props["aria-invalid"]);
    const helperId =
      selectId && (error || helperText) ? `${selectId}-hint` : undefined;

    return (
      <label style={getFieldWrapperStyle()}>
        {label ? <span style={getLabelStyle()}>{label}</span> : null}
        <select
          ref={ref}
          id={selectId}
          name={name}
          disabled={disabled}
          required={required}
          aria-invalid={invalid || undefined}
          aria-describedby={helperId}
          className={className}
          data-size={size}
          style={mergeStyles(getFieldStyle(size, invalid, disabled), style)}
          {...props}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        {error || helperText ? (
          <span id={helperId} style={getHelperTextStyle(Boolean(error))}>
            {error ?? helperText}
          </span>
        ) : null}
      </label>
    );
  }
);

Select.displayName = "Select";
