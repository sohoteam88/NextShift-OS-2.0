import type { BusinessId } from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import type { CustomerId } from "../src/customer";
import {
  InMemoryInteractionRepository,
  Interaction,
  type InteractionId,
} from "../src/interaction";

const businessId = "business-1" as BusinessId;
const customerId = "customer-1" as CustomerId;
const interactionId = "interaction-1" as InteractionId;
const occurredAt = "2026-06-27T00:00:00.000Z";

function createInteraction(
  id: InteractionId = interactionId,
  timestamp = occurredAt
): Interaction {
  void businessId;

  return Interaction.record({
    interactionId: id,
    customerId,
    interactionType: "Call",
    interactionChannel: "Phone",
    outcome: "Booked discovery meeting",
    note: "Spoke with the owner.",
    occurredAt: timestamp,
    recordedBy: "user-1",
  });
}

describe("Interaction aggregate", () => {
  it("creates an interaction", () => {
    const interaction = createInteraction();

    expect(interaction.toSnapshot()).toMatchObject({
      interactionId,
      customerId,
      interactionType: "call",
      interactionChannel: "phone",
      outcome: "Booked discovery meeting",
      note: "Spoke with the owner.",
      occurredAt,
      recordedBy: "user-1",
    });
  });

  it("creates a customer note", () => {
    const interaction = Interaction.addNote({
      interactionId,
      customerId,
      note: "Prefers WhatsApp updates.",
      occurredAt,
      recordedBy: "user-1",
    });

    expect(interaction.toSnapshot()).toMatchObject({
      interactionType: "note",
      interactionChannel: "note",
      outcome: "noted",
      note: "Prefers WhatsApp updates.",
    });
  });

  it("requires a note for customer notes", () => {
    expect(() =>
      Interaction.addNote({
        interactionId,
        customerId,
        note: " ",
        occurredAt,
        recordedBy: "user-1",
      })
    ).toThrow("Customer note is required.");
  });

  it("keeps occurredAt immutable by exposing cloned snapshots", () => {
    const interaction = createInteraction();
    const snapshot = interaction.toSnapshot() as { occurredAt: string };

    snapshot.occurredAt = "2026-06-27T01:00:00.000Z";

    expect(interaction.toSnapshot().occurredAt).toBe(occurredAt);
  });

  it("keeps customerId immutable by exposing cloned snapshots", () => {
    const interaction = createInteraction();
    const snapshot = interaction.toSnapshot() as { customerId: CustomerId };

    snapshot.customerId = "customer-2" as CustomerId;

    expect(interaction.toSnapshot().customerId).toBe(customerId);
  });

  it("does not expose mutation methods", () => {
    const interaction = createInteraction() as unknown as {
      update?: unknown;
      delete?: unknown;
    };

    expect(interaction.update).toBeUndefined();
    expect(interaction.delete).toBeUndefined();
  });

  it("rejects unsupported interaction types", () => {
    expect(() =>
      Interaction.record({
        interactionId,
        customerId,
        interactionType: "fax",
        interactionChannel: "fax",
        outcome: "Sent",
        occurredAt,
        recordedBy: "user-1",
      })
    ).toThrow("Unsupported interaction type: fax.");
  });
});

describe("InMemoryInteractionRepository", () => {
  it("saves and retrieves an interaction by ID", async () => {
    const repository = new InMemoryInteractionRepository();
    const interaction = createInteraction();

    await repository.save(interaction);

    expect((await repository.findById(interactionId))?.toSnapshot()).toEqual(
      interaction.toSnapshot()
    );
  });

  it("finds interactions by customer", async () => {
    const repository = new InMemoryInteractionRepository();

    await repository.save(createInteraction());

    expect(await repository.findByCustomer(customerId)).toHaveLength(1);
  });

  it("orders timelines chronologically", async () => {
    const repository = new InMemoryInteractionRepository();

    await repository.save(
      createInteraction(
        "interaction-2" as InteractionId,
        "2026-06-27T02:00:00.000Z"
      )
    );
    await repository.save(
      createInteraction(
        "interaction-1" as InteractionId,
        "2026-06-27T01:00:00.000Z"
      )
    );

    const timeline = await repository.timeline(customerId);

    expect(timeline.map((interaction) => interaction.interactionId)).toEqual([
      "interaction-1",
      "interaction-2",
    ]);
  });

  it("preserves insertion order for identical timestamps", async () => {
    const repository = new InMemoryInteractionRepository();

    await repository.save(createInteraction("interaction-1" as InteractionId));
    await repository.save(createInteraction("interaction-2" as InteractionId));

    const timeline = await repository.timeline(customerId);

    expect(timeline.map((interaction) => interaction.interactionId)).toEqual([
      "interaction-1",
      "interaction-2",
    ]);
  });

  it("prevents modification by rejecting duplicate saves", async () => {
    const repository = new InMemoryInteractionRepository();

    await repository.save(createInteraction());

    await expect(repository.save(createInteraction())).rejects.toThrow(
      "Existing interactions cannot be modified."
    );
  });

  it("does not expose deletion", () => {
    const repository = new InMemoryInteractionRepository() as unknown as {
      delete?: unknown;
    };

    expect(repository.delete).toBeUndefined();
  });
});
