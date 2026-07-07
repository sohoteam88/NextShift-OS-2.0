export type RuntimeCapabilityLifecycleState =
  | "registered"
  | "active"
  | "suspended"
  | "retired";

export function isTerminalRuntimeCapabilityLifecycleState(
  state: RuntimeCapabilityLifecycleState
): boolean {
  return state === "retired";
}

export function isRuntimeCapabilityLifecycleState(
  value: unknown
): value is RuntimeCapabilityLifecycleState {
  return (
    value === "registered" ||
    value === "active" ||
    value === "suspended" ||
    value === "retired"
  );
}
