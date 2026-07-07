export type RuntimeDiagnosticsErrorCode =
  | "RUNTIME_DIAGNOSTICS_INVALID"
  | "RUNTIME_DIAGNOSTICS_FORBIDDEN_VALUE";

export interface RuntimeDiagnosticsErrorDetails {
  readonly field?: string;
  readonly diagnosticsId?: string;
}

export class RuntimeDiagnosticsError extends Error {
  readonly code: RuntimeDiagnosticsErrorCode;
  readonly details: RuntimeDiagnosticsErrorDetails;

  constructor(
    code: RuntimeDiagnosticsErrorCode,
    message: string,
    details: RuntimeDiagnosticsErrorDetails = {}
  ) {
    super(message);
    this.name = "RuntimeDiagnosticsError";
    this.code = code;
    this.details = details;
  }
}
