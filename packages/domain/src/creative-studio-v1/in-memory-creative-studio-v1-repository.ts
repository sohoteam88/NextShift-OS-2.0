import type { BusinessId } from "@nextshift/shared";
import type { ConversationEngineV1Id } from "../conversation-engine-v1";
import { CreativeStudioV1 } from "./creative-studio-v1";
import type {
  CreativeStudioV1Id,
  CreativeStudioV1Snapshot,
} from "./creative-studio-v1";
import type { CreativeStudioV1Repository } from "./creative-studio-v1-repository";

export class InMemoryCreativeStudioV1Repository
  implements CreativeStudioV1Repository
{
  private readonly creativeStudios = new Map<
    CreativeStudioV1Id,
    CreativeStudioV1Snapshot
  >();

  async save(creativeStudio: CreativeStudioV1): Promise<void> {
    const snapshot = creativeStudio.toSnapshot();
    this.creativeStudios.set(snapshot.creativeStudioId, cloneSnapshot(snapshot));
  }

  async findById(
    creativeStudioId: CreativeStudioV1Id
  ): Promise<CreativeStudioV1 | null> {
    const snapshot = this.creativeStudios.get(creativeStudioId);
    return snapshot ? CreativeStudioV1.rehydrate(snapshot) : null;
  }

  async findByBusinessId(
    businessId: BusinessId
  ): Promise<readonly CreativeStudioV1[]> {
    return [...this.creativeStudios.values()]
      .filter((snapshot) => snapshot.businessId === businessId)
      .sort(compareCreativeStudios)
      .map((snapshot) => CreativeStudioV1.rehydrate(snapshot));
  }

  async findLatestByConversationId(
    conversationId: ConversationEngineV1Id
  ): Promise<CreativeStudioV1 | null> {
    const snapshot = [...this.creativeStudios.values()]
      .filter((item) => item.conversationId === conversationId)
      .sort(compareCreativeStudios)
      .at(-1);

    return snapshot ? CreativeStudioV1.rehydrate(snapshot) : null;
  }

  async exists(creativeStudioId: CreativeStudioV1Id): Promise<boolean> {
    return this.creativeStudios.has(creativeStudioId);
  }
}

function compareCreativeStudios(
  left: CreativeStudioV1Snapshot,
  right: CreativeStudioV1Snapshot
): number {
  return Date.parse(left.createdAt) - Date.parse(right.createdAt);
}

function cloneSnapshot(
  snapshot: CreativeStudioV1Snapshot
): CreativeStudioV1Snapshot {
  return CreativeStudioV1.rehydrate(snapshot).toSnapshot();
}
