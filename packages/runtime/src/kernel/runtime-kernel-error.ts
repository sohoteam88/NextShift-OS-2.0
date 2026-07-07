import type { RuntimeKernelState } from "./runtime-kernel-state";

export type RuntimeKernelErrorCode =
  | "RUNTIME_KERNEL_INVALID_TRANSITION"
  | "RUNTIME_KERNEL_ALREADY_TERMINAL";

export interface RuntimeKernelErrorDetails {
  readonly from?: RuntimeKernelState;
  readonly to?: RuntimeKernelState;
  readonly operation?: string;
}

export class RuntimeKernelError extends Error {
  readonly code: RuntimeKernelErrorCode;
  readonly details: RuntimeKernelErrorDetails;

  constructor(
    code: RuntimeKernelErrorCode,
    message: string,
    details: RuntimeKernelErrorDetails = {}
  ) {
    super(message);
    this.name = "RuntimeKernelError";
    this.code = code;
    this.details = details;
  }
}
