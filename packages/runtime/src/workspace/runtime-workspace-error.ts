import type { RuntimeWorkspaceLifecycleState } from "./runtime-workspace-lifecycle";

export type RuntimeWorkspaceErrorCode =
  | "RUNTIME_WORKSPACE_INVALID"
  | "RUNTIME_WORKSPACE_INVALID_TRANSITION"
  | "RUNTIME_WORKSPACE_ISOLATION_VIOLATION"
  | "RUNTIME_WORKSPACE_FORBIDDEN_VALUE";

export interface RuntimeWorkspaceErrorDetails {
  readonly field?: string;
  readonly workspaceId?: string;
  readonly from?: RuntimeWorkspaceLifecycleState;
  readonly to?: RuntimeWorkspaceLifecycleState;
  readonly operation?: string;
  readonly contextScope?: string;
  readonly sessionWorkspaceId?: string;
}

export class RuntimeWorkspaceError extends Error {
  readonly code: RuntimeWorkspaceErrorCode;
  readonly details: RuntimeWorkspaceErrorDetails;

  constructor(
    code: RuntimeWorkspaceErrorCode,
    message: string,
    details: RuntimeWorkspaceErrorDetails = {}
  ) {
    super(message);
    this.name = "RuntimeWorkspaceError";
    this.code = code;
    this.details = details;
  }
}
