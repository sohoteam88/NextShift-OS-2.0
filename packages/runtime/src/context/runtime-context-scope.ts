export type RuntimeContextScope =
  | "kernel"
  | "workspace"
  | "session"
  | "capability"
  | "event";

const scopeRank: Readonly<Record<RuntimeContextScope, number>> = {
  kernel: 0,
  workspace: 1,
  session: 2,
  capability: 3,
  event: 4,
};

export function canDeriveRuntimeContextScope(
  parentScope: RuntimeContextScope,
  childScope: RuntimeContextScope
): boolean {
  return scopeRank[childScope] >= scopeRank[parentScope];
}

export function isRuntimeContextScope(value: unknown): value is RuntimeContextScope {
  return (
    value === "kernel" ||
    value === "workspace" ||
    value === "session" ||
    value === "capability" ||
    value === "event"
  );
}
