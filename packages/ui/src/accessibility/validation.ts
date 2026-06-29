import type {
  AccessibilityLandmarkRole,
  AccessibilityValidationIssue,
  AccessibilityValidationResult,
  AccessibleNameOptions,
} from "../types";

function result(issues: readonly AccessibilityValidationIssue[]): AccessibilityValidationResult {
  return {
    issues,
    valid: !issues.some((issue) => issue.severity === "error"),
  };
}

export function validateAccessibleName(
  options: AccessibleNameOptions
): AccessibilityValidationResult {
  const hasName = Boolean(
    options.ariaLabel?.trim() ||
      options.ariaLabelledBy?.trim() ||
      options.title?.trim() ||
      options.text?.trim()
  );

  return result(
    hasName
      ? []
      : [
          {
            code: "accessible-name-missing",
            message: "Interactive and landmark elements require an accessible name.",
            severity: "error",
          },
        ]
  );
}

export function validateLandmarkSemantics(options: {
  readonly role: AccessibilityLandmarkRole;
  readonly label?: string;
  readonly labelledBy?: string;
}): AccessibilityValidationResult {
  const rolesRequiringName: readonly AccessibilityLandmarkRole[] = [
    "complementary",
    "form",
    "navigation",
    "region",
    "search",
  ];

  if (!rolesRequiringName.includes(options.role)) {
    return result([]);
  }

  return validateAccessibleName({
    ariaLabel: options.label,
    ariaLabelledBy: options.labelledBy,
  });
}

export function validateAriaReferences(options: {
  readonly referencedIds: readonly string[];
  readonly availableIds: readonly string[];
}): AccessibilityValidationResult {
  const missing = options.referencedIds.filter(
    (id) => !options.availableIds.includes(id)
  );

  return result(
    missing.map((id) => ({
      code: "aria-reference-missing",
      message: `ARIA reference "${id}" does not match an available element id.`,
      severity: "error" as const,
    }))
  );
}
