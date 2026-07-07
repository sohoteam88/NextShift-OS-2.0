export type RuntimeEventErrorCode =
  | "RUNTIME_EVENT_INVALID"
  | "RUNTIME_EVENT_ISOLATION_VIOLATION"
  | "RUNTIME_EVENT_FORBIDDEN_VALUE";

export interface RuntimeEventErrorDetails {
  readonly field?: string;
  readonly eventId?: string;
  readonly contextScope?: string;
  readonly workspaceId?: string;
  readonly eventWorkspaceId?: string;
  readonly capabilityWorkspaceId?: string;
  readonly sessionWorkspaceId?: string;
  readonly capabilityId?: string;
  readonly eventCapabilityId?: string;
}

export class RuntimeEventError extends Error {
  readonly code: RuntimeEventErrorCode;
  readonly details: RuntimeEventErrorDetails;

  constructor(
    code: RuntimeEventErrorCode,
    message: string,
    details: RuntimeEventErrorDetails = {}
  ) {
    super(message);
    this.name = "RuntimeEventError";
    this.code = code;
    this.details = details;
  }
}
