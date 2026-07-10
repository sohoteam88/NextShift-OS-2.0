import type { BusinessId } from "@nextshift/shared";
import type { BusinessBrainV1Id } from "../business-brain-v1";
import type {
  DecisionEngineV1,
  DecisionEngineV1Id,
} from "./decision-engine-v1";

export interface DecisionEngineV1Repository {
  save(engine: DecisionEngineV1): Promise<void>;
  findById(engineId: DecisionEngineV1Id): Promise<DecisionEngineV1 | null>;
  findByBusinessId(businessId: BusinessId): Promise<readonly DecisionEngineV1[]>;
  findLatestByBrainId(
    brainId: BusinessBrainV1Id
  ): Promise<DecisionEngineV1 | null>;
  exists(engineId: DecisionEngineV1Id): Promise<boolean>;
}
