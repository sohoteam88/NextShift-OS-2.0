import * as React from "react";
import type { AccessibilityLandmarkRole } from "../types";

export interface LandmarkProps extends React.HTMLAttributes<HTMLElement> {
  readonly roleName?: AccessibilityLandmarkRole;
  readonly label?: string;
  readonly labelledBy?: string;
  readonly as?: "aside" | "div" | "footer" | "form" | "header" | "main" | "nav" | "section";
}

export function getLandmarkProps(options: {
  readonly role: AccessibilityLandmarkRole;
  readonly label?: string;
  readonly labelledBy?: string;
}): Pick<React.HTMLAttributes<HTMLElement>, "role" | "aria-label" | "aria-labelledby"> {
  return {
    "aria-label": options.label,
    "aria-labelledby": options.labelledBy,
    role: options.role,
  };
}

export function Landmark({
  roleName = "region",
  label,
  labelledBy,
  as: Element = "section",
  children,
  ...props
}: LandmarkProps): React.ReactElement {
  return (
    <Element
      data-nextshift-accessibility="landmark"
      {...getLandmarkProps({ role: roleName, label, labelledBy })}
      {...props}
    >
      {children}
    </Element>
  );
}
