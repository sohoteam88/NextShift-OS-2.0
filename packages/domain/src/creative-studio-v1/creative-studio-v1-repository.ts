import type { BusinessId } from "@nextshift/shared";
import type { ConversationEngineV1Id } from "../conversation-engine-v1";
import type { CreativeStudioV1, CreativeStudioV1Id } from "./creative-studio-v1";

export interface CreativeStudioV1Repository {
  save(creativeStudio: CreativeStudioV1): Promise<void>;
  findById(creativeStudioId: CreativeStudioV1Id): Promise<CreativeStudioV1 | null>;
  findByBusinessId(businessId: BusinessId): Promise<readonly CreativeStudioV1[]>;
  findLatestByConversationId(
    conversationId: ConversationEngineV1Id
  ): Promise<CreativeStudioV1 | null>;
  exists(creativeStudioId: CreativeStudioV1Id): Promise<boolean>;
}
