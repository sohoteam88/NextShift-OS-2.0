export type AccessibilityLiveRegionPoliteness = "off" | "polite" | "assertive";

export type AccessibilityLiveRegionRole = "status" | "alert" | "log";

export type AccessibilityLandmarkRole =
  | "banner"
  | "complementary"
  | "contentinfo"
  | "form"
  | "main"
  | "navigation"
  | "region"
  | "search";

export type RovingFocusOrientation = "horizontal" | "vertical" | "both";

export type RovingFocusDirection = "first" | "last" | "next" | "previous";

export type ReducedMotionPreference = "system" | "always" | "never";

export type ContrastCompliance = "AA" | "AAA";

export interface AccessibilityValidationIssue {
  readonly code: string;
  readonly message: string;
  readonly severity: "error" | "warning";
}

export interface AccessibilityValidationResult {
  readonly valid: boolean;
  readonly issues: readonly AccessibilityValidationIssue[];
}

export interface AccessibleNameOptions {
  readonly ariaLabel?: string;
  readonly ariaLabelledBy?: string;
  readonly title?: string;
  readonly text?: string;
}
