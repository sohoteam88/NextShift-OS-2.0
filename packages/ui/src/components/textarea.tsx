import * as React from "react";
import {
  getFieldStyle,
  getFieldWrapperStyle,
  getHelperTextStyle,
  getLabelStyle,
  mergeStyles,
} from "../styles";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  readonly label?: string;
  readonly helperText?: string;
  readonly error?: string;
  readonly resize?: "none" | "vertical" | "horizontal" | "both";
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      helperText,
      error,
      resize = "vertical",
      id,
      name,
      disabled = false,
      required,
      className,
      style,
      rows = 4,
      ...props
    },
    ref
  ) => {
    const textareaId = id ?? name;
    const invalid = Boolean(error || props["aria-invalid"]);
    const helperId =
      textareaId && (error || helperText) ? `${textareaId}-hint` : undefined;

    return (
      <label style={getFieldWrapperStyle()}>
        {label ? <span style={getLabelStyle()}>{label}</span> : null}
        <textarea
          ref={ref}
          id={textareaId}
          name={name}
          disabled={disabled}
          required={required}
          rows={rows}
          aria-invalid={invalid || undefined}
          aria-describedby={helperId}
          className={className}
          style={mergeStyles(
            getFieldStyle("md", invalid, disabled),
            { minHeight: "6rem", resize },
            style
          )}
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

Textarea.displayName = "Textarea";
