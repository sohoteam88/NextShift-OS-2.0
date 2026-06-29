import * as React from "react";
import type {
  AccessibilityLiveRegionPoliteness,
  AccessibilityLiveRegionRole,
} from "../types";
import { getLiveRegionStyle, mergeStyles } from "../styles";

export interface LiveRegionProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly politeness?: AccessibilityLiveRegionPoliteness;
  readonly regionRole?: AccessibilityLiveRegionRole;
  readonly atomic?: boolean;
  readonly visible?: boolean;
  readonly children: React.ReactNode;
}

export function getLiveRegionProps(options: {
  readonly politeness?: AccessibilityLiveRegionPoliteness;
  readonly role?: AccessibilityLiveRegionRole;
  readonly atomic?: boolean;
}): Pick<React.HTMLAttributes<HTMLElement>, "role" | "aria-live" | "aria-atomic"> {
  return {
    "aria-atomic": options.atomic ?? true,
    "aria-live": options.politeness ?? "polite",
    role: options.role ?? "status",
  };
}

export function LiveRegion({
  politeness = "polite",
  regionRole = politeness === "assertive" ? "alert" : "status",
  atomic = true,
  visible = false,
  children,
  style,
  ...props
}: LiveRegionProps): React.ReactElement {
  return (
    <div
      data-nextshift-accessibility="live-region"
      style={mergeStyles(getLiveRegionStyle(visible), style)}
      {...getLiveRegionProps({ politeness, role: regionRole, atomic })}
      {...props}
    >
      {children}
    </div>
  );
}

export function createLiveRegionMessage(
  title: string,
  detail?: string
): string {
  return [title, detail].filter(Boolean).join(": ");
}
