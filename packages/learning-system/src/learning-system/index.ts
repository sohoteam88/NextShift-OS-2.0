import type {
  LearningRecord,
  LearningSystemContract,
  RecordLearningRequest,
} from "@nextshift/contracts";
import type { Result } from "@nextshift/shared";

export class LearningSystem implements LearningSystemContract {
  async recordLearning(
    request: RecordLearningRequest
  ): Promise<Result<LearningRecord>> {
    return {
      ok: false,
      error: {
        name: "NotImplementedError",
        message: `LearningSystem.recordLearning is not implemented yet for learning: ${request.learning.learningId}`,
      },
    };
  }
}
