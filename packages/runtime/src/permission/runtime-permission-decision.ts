export type RuntimePermissionDecision = "allow" | "deny" | "abstain";

export function isRuntimePermissionDecision(
  value: unknown
): value is RuntimePermissionDecision {
  return value === "allow" || value === "deny" || value === "abstain";
}
