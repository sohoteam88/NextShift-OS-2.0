import type { BusinessId, Timestamp } from "@nextshift/shared";

export type MemoryType =
  | "decision"
  | "preference"
  | "performance"
  | "relationship"
  | "learning"
  | "correction";

export interface BusinessMemory {
  readonly memoryId: string;
  readonly businessId: BusinessId;
  readonly type: MemoryType;
  readonly summary: string;
  readonly confidence?: number;
  readonly recordedAt: Timestamp;
}
