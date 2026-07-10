import type { RuntimeContextScope } from "./runtime-context-scope";

export type RuntimeContextErrorCode =
  | "RUNTIME_CONTEXT_INVALID"
  | "RUNTIME_CONTEXT_SCOPE_VIOLATION"
  | "RUNTIME_CONTEXT_FORBIDDEN_VALUE";

export interface RuntimeContextErrorDetails {
  readonly field?: string;
  readonly parentScope?: RuntimeContextScope;
  readonly childScope?: RuntimeContextScope;
}

export class RuntimeContextError extends Error {
  readonly code: RuntimeContextErrorCode;
  readonly details: RuntimeContextErrorDetails;

  constructor(
    code: RuntimeContextErrorCode,
    message: string,
    details: RuntimeContextErrorDetails = {}
  ) {
    super(message);
    this.name = "RuntimeContextError";
    this.code = code;
    this.details = details;
  }
}
