export type RuntimeWorkspaceLifecycleState =
  | "created"
  | "active"
  | "suspended"
  | "closed";

export function isTerminalRuntimeWorkspaceLifecycleState(
  state: RuntimeWorkspaceLifecycleState
): boolean {
  return state === "closed";
}

export function isRuntimeWorkspaceLifecycleState(
  value: unknown
): value is RuntimeWorkspaceLifecycleState {
  return (
    value === "created" ||
    value === "active" ||
    value === "suspended" ||
    value === "closed"
  );
}
