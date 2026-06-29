import type { Timestamp } from "@nextshift/shared";

export type CapabilityResultStatus =
  | "completed"
  | "failed"
  | "skipped";

export interface CapabilityResult {
  readonly status: CapabilityResultStatus;
  readonly summary: string;
  readonly completedAt: Timestamp;
  readonly output?: unknown;
}
