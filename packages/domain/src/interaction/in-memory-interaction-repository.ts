import type { CustomerId } from "../customer";
import { Interaction } from ".";
import type { InteractionId, InteractionSnapshot } from ".";
import type { InteractionRepository } from "./interaction-repository";

interface StoredInteraction {
  readonly snapshot: InteractionSnapshot;
  readonly sequence: number;
}

export class InMemoryInteractionRepository implements InteractionRepository {
  private readonly interactions = new Map<InteractionId, StoredInteraction>();
  private nextSequence = 0;

  async save(interaction: Interaction): Promise<void> {
    const snapshot = interaction.toSnapshot();

    if (this.interactions.has(snapshot.interactionId)) {
      throw new Error("Existing interactions cannot be modified.");
    }

    this.interactions.set(snapshot.interactionId, {
      snapshot: cloneSnapshot(snapshot),
      sequence: this.nextSequence,
    });
    this.nextSequence += 1;
  }

  async findById(interactionId: InteractionId): Promise<Interaction | null> {
    const stored = this.interactions.get(interactionId);
    return stored ? Interaction.rehydrate(stored.snapshot) : null;
  }

  async findByCustomer(customerId: CustomerId): Promise<readonly Interaction[]> {
    return this.timeline(customerId);
  }

  async timeline(customerId: CustomerId): Promise<readonly Interaction[]> {
    return [...this.interactions.values()]
      .filter((stored) => stored.snapshot.customerId === customerId)
      .sort(compareTimelineEntries)
      .map((stored) => Interaction.rehydrate(stored.snapshot));
  }
}

function compareTimelineEntries(
  left: StoredInteraction,
  right: StoredInteraction
): number {
  const byOccurredAt =
    Date.parse(left.snapshot.occurredAt) - Date.parse(right.snapshot.occurredAt);

  return byOccurredAt === 0 ? left.sequence - right.sequence : byOccurredAt;
}

function cloneSnapshot(snapshot: InteractionSnapshot): InteractionSnapshot {
  return {
    ...snapshot,
    metadata:
      snapshot.metadata === undefined ? undefined : { ...snapshot.metadata },
  };
}
