export type ErrorCode = string;

export interface NextShiftError {
  readonly code: ErrorCode;
  readonly message: string;
  readonly cause?: unknown;
}

export interface ValidationError extends NextShiftError {
  readonly kind: "ValidationError";
}

export interface DomainError extends NextShiftError {
  readonly kind: "DomainError";
}

export interface InfrastructureError extends NextShiftError {
  readonly kind: "InfrastructureError";
}

export interface AuthorizationError extends NextShiftError {
  readonly kind: "AuthorizationError";
}

export interface ConfigurationError extends NextShiftError {
  readonly kind: "ConfigurationError";
}
