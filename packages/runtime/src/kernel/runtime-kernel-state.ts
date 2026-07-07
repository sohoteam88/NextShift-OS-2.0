export type RuntimeKernelState =
  | "created"
  | "initializing"
  | "running"
  | "stopping"
  | "stopped"
  | "failed";

export function isTerminalRuntimeKernelState(state: RuntimeKernelState): boolean {
  return state === "stopped" || state === "failed";
}
