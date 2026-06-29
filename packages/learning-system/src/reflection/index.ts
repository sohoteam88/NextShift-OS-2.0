import type { LearningRecord } from "@nextshift/contracts";
import type { Result } from "@nextshift/shared";

export interface ReflectionPort {
  reflect(input: unknown): Promise<Result<LearningRecord>>;
}
