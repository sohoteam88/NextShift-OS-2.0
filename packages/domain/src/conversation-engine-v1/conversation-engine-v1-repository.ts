import type { BusinessId } from "@nextshift/shared";
import type { DecisionEngineV1Id } from "../decision-engine-v1";
import type {
  ConversationEngineV1,
  ConversationEngineV1Id,
} from "./conversation-engine-v1";

export interface ConversationEngineV1Repository {
  save(conversation: ConversationEngineV1): Promise<void>;
  findById(
    conversationId: ConversationEngineV1Id
  ): Promise<ConversationEngineV1 | null>;
  findByBusinessId(
    businessId: BusinessId
  ): Promise<readonly ConversationEngineV1[]>;
  findLatestByDecisionEngineId(
    engineId: DecisionEngineV1Id
  ): Promise<ConversationEngineV1 | null>;
  exists(conversationId: ConversationEngineV1Id): Promise<boolean>;
}
