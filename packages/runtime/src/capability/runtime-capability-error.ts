import type { RuntimeCapabilityLifecycleState } from "./runtime-capability-lifecycle";

export type RuntimeCapabilityErrorCode =
  | "RUNTIME_CAPABILITY_INVALID"
  | "RUNTIME_CAPABILITY_INVALID_TRANSITION"
  | "RUNTIME_CAPABILITY_ISOLATION_VIOLATION"
  | "RUNTIME_CAPABILITY_FORBIDDEN_VALUE";

export interface RuntimeCapabilityErrorDetails {
  readonly field?: string;
  readonly capabilityId?: string;
  readonly from?: RuntimeCapabilityLifecycleState;
  readonly to?: RuntimeCapabilityLifecycleState;
  readonly operation?: string;
  readonly contextScope?: string;
  readonly workspaceId?: string;
  readonly capabilityWorkspaceId?: string;
  readonly sessionWorkspaceId?: string;
}

export class RuntimeCapabilityError extends Error {
  readonly code: RuntimeCapabilityErrorCode;
  readonly details: RuntimeCapabilityErrorDetails;

  constructor(
    code: RuntimeCapabilityErrorCode,
    message: string,
    details: RuntimeCapabilityErrorDetails = {}
  ) {
    super(message);
    this.name = "RuntimeCapabilityError";
    this.code = code;
    this.details = details;
  }
}
