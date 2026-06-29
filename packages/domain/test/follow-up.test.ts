import { describe, expect, it } from "vitest";
import type { CustomerId } from "../src/customer";
import type { InteractionId } from "../src/interaction";
import {
  FollowUp,
  InMemoryFollowUpRepository,
  type FollowUpId,
} from "../src/follow-up";

const followUpId = "follow-up-1" as FollowUpId;
const customerId = "customer-1" as CustomerId;
const interactionId = "interaction-1" as InteractionId;
const createdAt = "2026-06-27T00:00:00.000Z";
const dueAt = "2026-06-28T00:00:00.000Z";

function scheduleFollowUp(
  id: FollowUpId = followUpId,
  dueTimestamp = dueAt
): FollowUp {
  return FollowUp.schedule({
    followUpId: id,
    customerId,
    interactionId,
    title: "Send proposal",
    description: "Share follow-up proposal.",
    priority: "High",
    dueAt: dueTimestamp,
    assignedTo: "user-1",
    createdAt,
  });
}

describe("FollowUp aggregate", () => {
  it("schedules a follow-up", () => {
    const followUp = scheduleFollowUp();

    expect(followUp.toSnapshot()).toMatchObject({
      followUpId,
      customerId,
      interactionId,
      title: "Send proposal",
      description: "Share follow-up proposal.",
      priority: "high",
      status: "pending",
      dueAt,
      assignedTo: "user-1",
      createdAt,
      updatedAt: createdAt,
    });
  });

  it("updates a pending follow-up", () => {
    const followUp = scheduleFollowUp();

    followUp.update({
      title: "Send revised proposal",
      priority: "urgent",
      dueAt: "2026-06-29T00:00:00.000Z",
      updatedAt: "2026-06-27T01:00:00.000Z",
    });

    expect(followUp.toSnapshot()).toMatchObject({
      title: "Send revised proposal",
      priority: "urgent",
      dueAt: "2026-06-29T00:00:00.000Z",
      updatedAt: "2026-06-27T01:00:00.000Z",
    });
  });

  it("completes a follow-up", () => {
    const followUp = scheduleFollowUp();

    followUp.complete("2026-06-27T02:00:00.000Z");

    expect(followUp.toSnapshot()).toMatchObject({
      status: "completed",
      completedAt: "2026-06-27T02:00:00.000Z",
    });
  });

  it("cancels a follow-up", () => {
    const followUp = scheduleFollowUp();

    followUp.cancel("2026-06-27T03:00:00.000Z");

    expect(followUp.toSnapshot()).toMatchObject({
      status: "cancelled",
      cancelledAt: "2026-06-27T03:00:00.000Z",
    });
  });

  it("detects overdue as derived state", () => {
    const followUp = scheduleFollowUp(
      followUpId,
      "2026-06-27T00:00:00.000Z"
    );

    expect(followUp.isOverdue("2026-06-27T01:00:00.000Z")).toBe(true);

    followUp.complete("2026-06-27T01:30:00.000Z");

    expect(followUp.isOverdue("2026-06-27T02:00:00.000Z")).toBe(false);
    expect(followUp.toSnapshot()).not.toHaveProperty("overdue");
  });

  it("prevents invalid transitions", () => {
    const cancelled = scheduleFollowUp();
    cancelled.cancel("2026-06-27T03:00:00.000Z");

    expect(() => cancelled.complete("2026-06-27T04:00:00.000Z")).toThrow(
      "Cancelled follow-ups cannot be completed."
    );

    const completed = scheduleFollowUp("follow-up-2" as FollowUpId);
    completed.complete("2026-06-27T03:00:00.000Z");

    expect(() =>
      completed.update({
        title: "Change completed",
        updatedAt: "2026-06-27T04:00:00.000Z",
      })
    ).toThrow("Completed follow-ups cannot be modified.");
  });

  it("fails without a title", () => {
    expect(() =>
      FollowUp.schedule({
        followUpId,
        customerId,
        title: " ",
        dueAt,
        createdAt,
      })
    ).toThrow("Follow-up title is required.");
  });
});

describe("InMemoryFollowUpRepository", () => {
  it("saves and retrieves a follow-up by ID", async () => {
    const repository = new InMemoryFollowUpRepository();
    const followUp = scheduleFollowUp();

    await repository.save(followUp);

    expect((await repository.findById(followUpId))?.toSnapshot()).toEqual(
      followUp.toSnapshot()
    );
  });

  it("finds follow-ups by customer", async () => {
    const repository = new InMemoryFollowUpRepository();

    await repository.save(scheduleFollowUp());

    expect(await repository.findByCustomer(customerId)).toHaveLength(1);
  });

  it("finds pending follow-ups", async () => {
    const repository = new InMemoryFollowUpRepository();
    const pending = scheduleFollowUp("follow-up-1" as FollowUpId);
    const completed = scheduleFollowUp("follow-up-2" as FollowUpId);

    completed.complete("2026-06-27T02:00:00.000Z");

    await repository.save(completed);
    await repository.save(pending);

    expect((await repository.findPending()).map((item) => item.followUpId)).toEqual([
      "follow-up-1",
    ]);
  });

  it("finds overdue follow-ups", async () => {
    const repository = new InMemoryFollowUpRepository();
    const overdue = scheduleFollowUp(
      "follow-up-1" as FollowUpId,
      "2026-06-27T00:00:00.000Z"
    );
    const future = scheduleFollowUp(
      "follow-up-2" as FollowUpId,
      "2026-06-29T00:00:00.000Z"
    );

    await repository.save(future);
    await repository.save(overdue);

    expect(
      (await repository.findOverdue("2026-06-28T00:00:00.000Z")).map(
        (item) => item.followUpId
      )
    ).toEqual(["follow-up-1"]);
  });

  it("completes and cancels follow-ups", async () => {
    const repository = new InMemoryFollowUpRepository();

    await repository.save(scheduleFollowUp("follow-up-1" as FollowUpId));
    await repository.save(scheduleFollowUp("follow-up-2" as FollowUpId));

    await repository.complete(
      "follow-up-1" as FollowUpId,
      "2026-06-27T02:00:00.000Z"
    );
    await repository.cancel(
      "follow-up-2" as FollowUpId,
      "2026-06-27T03:00:00.000Z"
    );

    expect(
      (await repository.findById("follow-up-1" as FollowUpId))?.toSnapshot()
        .status
    ).toBe("completed");
    expect(
      (await repository.findById("follow-up-2" as FollowUpId))?.toSnapshot()
        .status
    ).toBe("cancelled");
  });
});
