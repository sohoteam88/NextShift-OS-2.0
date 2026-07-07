export type RuntimeEventType = string;

const runtimeEventTypePattern = /^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)+$/;

export function isRuntimeEventType(value: unknown): value is RuntimeEventType {
  return typeof value === "string" && runtimeEventTypePattern.test(value.trim());
}
