import type { CausationId, CorrelationId } from "../ids";
import type { Timestamp } from "../time";

export interface AuditMetadata {
  readonly createdAt: Timestamp;
  readonly updatedAt?: Timestamp;
  readonly version?: number;
}

export interface SourceMetadata {
  readonly source: string;
  readonly correlationId?: CorrelationId;
  readonly causationId?: CausationId;
}
