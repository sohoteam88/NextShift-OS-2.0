export type RuntimeSessionLifecycleState = "active" | "renewed" | "expired";

export function isTerminalRuntimeSessionLifecycleState(
  state: RuntimeSessionLifecycleState
): boolean {
  return state === "expired";
}

export function isRuntimeSessionLifecycleState(
  value: unknown
): value is RuntimeSessionLifecycleState {
  return value === "active" || value === "renewed" || value === "expired";
}
