import type { BusinessId } from "@nextshift/shared";
import type { DecisionEngineV1Id } from "../decision-engine-v1";
import { ConversationEngineV1 } from "./conversation-engine-v1";
import type {
  ConversationEngineV1Id,
  ConversationEngineV1Snapshot,
} from "./conversation-engine-v1";
import type { ConversationEngineV1Repository } from "./conversation-engine-v1-repository";

export class InMemoryConversationEngineV1Repository
  implements ConversationEngineV1Repository
{
  private readonly conversations = new Map<
    ConversationEngineV1Id,
    ConversationEngineV1Snapshot
  >();

  async save(conversation: ConversationEngineV1): Promise<void> {
    const snapshot = conversation.toSnapshot();
    this.conversations.set(snapshot.conversationId, cloneSnapshot(snapshot));
  }

  async findById(
    conversationId: ConversationEngineV1Id
  ): Promise<ConversationEngineV1 | null> {
    const snapshot = this.conversations.get(conversationId);
    return snapshot ? ConversationEngineV1.rehydrate(snapshot) : null;
  }

  async findByBusinessId(
    businessId: BusinessId
  ): Promise<readonly ConversationEngineV1[]> {
    return [...this.conversations.values()]
      .filter((snapshot) => snapshot.businessId === businessId)
      .sort(compareConversations)
      .map((snapshot) => ConversationEngineV1.rehydrate(snapshot));
  }

  async findLatestByDecisionEngineId(
    engineId: DecisionEngineV1Id
  ): Promise<ConversationEngineV1 | null> {
    const snapshot = [...this.conversations.values()]
      .filter((item) => item.engineId === engineId)
      .sort(compareConversations)
      .at(-1);

    return snapshot ? ConversationEngineV1.rehydrate(snapshot) : null;
  }

  async exists(conversationId: ConversationEngineV1Id): Promise<boolean> {
    return this.conversations.has(conversationId);
  }
}

function compareConversations(
  left: ConversationEngineV1Snapshot,
  right: ConversationEngineV1Snapshot
): number {
  return Date.parse(left.createdAt) - Date.parse(right.createdAt);
}

function cloneSnapshot(
  snapshot: ConversationEngineV1Snapshot
): ConversationEngineV1Snapshot {
  return ConversationEngineV1.rehydrate(snapshot).toSnapshot();
}
