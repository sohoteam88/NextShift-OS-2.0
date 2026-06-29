import type { ExecutionRecord } from "@nextshift/contracts";

export interface ExecutionRecordRepositoryPort {
  save(record: ExecutionRecord): Promise<void>;
}
