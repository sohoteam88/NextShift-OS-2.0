import * as React from "react";
import { getVisuallyHiddenStyle, mergeStyles } from "../styles";

export interface VisuallyHiddenProps extends React.HTMLAttributes<HTMLSpanElement> {
  readonly children: React.ReactNode;
}

export function VisuallyHidden({
  children,
  style,
  ...props
}: VisuallyHiddenProps): React.ReactElement {
  return (
    <span
      data-nextshift-accessibility="visually-hidden"
      style={mergeStyles(getVisuallyHiddenStyle(), style)}
      {...props}
    >
      {children}
    </span>
  );
}

export function createScreenReaderText(
  label: string,
  detail?: string
): string {
  return [label, detail].filter(Boolean).join(". ");
}
