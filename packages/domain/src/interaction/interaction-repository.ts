import type { CustomerId } from "../customer";
import type { Interaction, InteractionId } from ".";

export interface InteractionRepository {
  save(interaction: Interaction): Promise<void>;
  findById(interactionId: InteractionId): Promise<Interaction | null>;
  findByCustomer(customerId: CustomerId): Promise<readonly Interaction[]>;
  timeline(customerId: CustomerId): Promise<readonly Interaction[]>;
}
