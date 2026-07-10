export type RuntimePermissionErrorCode =
  | "RUNTIME_PERMISSION_INVALID"
  | "RUNTIME_PERMISSION_FORBIDDEN_VALUE";

export interface RuntimePermissionErrorDetails {
  readonly field?: string;
  readonly permissionId?: string;
}

export class RuntimePermissionError extends Error {
  readonly code: RuntimePermissionErrorCode;
  readonly details: RuntimePermissionErrorDetails;

  constructor(
    code: RuntimePermissionErrorCode,
    message: string,
    details: RuntimePermissionErrorDetails = {}
  ) {
    super(message);
    this.name = "RuntimePermissionError";
    this.code = code;
    this.details = details;
  }
}
