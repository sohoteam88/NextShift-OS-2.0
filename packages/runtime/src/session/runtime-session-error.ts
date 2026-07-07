import type { RuntimeSessionLifecycleState } from "./runtime-session-lifecycle";

export type RuntimeSessionErrorCode =
  | "RUNTIME_SESSION_INVALID"
  | "RUNTIME_SESSION_INVALID_TRANSITION"
  | "RUNTIME_SESSION_EXPIRED"
  | "RUNTIME_SESSION_ISOLATION_VIOLATION"
  | "RUNTIME_SESSION_FORBIDDEN_VALUE";

export interface RuntimeSessionErrorDetails {
  readonly field?: string;
  readonly sessionId?: string;
  readonly from?: RuntimeSessionLifecycleState;
  readonly to?: RuntimeSessionLifecycleState;
  readonly operation?: string;
  readonly contextScope?: string;
}

export class RuntimeSessionError extends Error {
  readonly code: RuntimeSessionErrorCode;
  readonly details: RuntimeSessionErrorDetails;

  constructor(
    code: RuntimeSessionErrorCode,
    message: string,
    details: RuntimeSessionErrorDetails = {}
  ) {
    super(message);
    this.name = "RuntimeSessionError";
    this.code = code;
    this.details = details;
  }
}
