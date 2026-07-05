import { describe, expect, it } from "vitest";
import { InMemoryEventBus } from "@nextshift/event-bus";
import { createRuntimeEvent, type RuntimeEvent } from "@nextshift/runtime-core";

describe("InMemoryEventBus", () => {
  it("publishes runtime events to subscribers", async () => {
    const eventBus = new InMemoryEventBus<RuntimeEvent>();
    const received: RuntimeEvent[] = [];

    eventBus.subscribe("runtime.workflow.started", (event) => {
      received.push(event);
    });

    const event = createRuntimeEvent({
      id: "runtime-event-1",
      type: "runtime.workflow.started",
      source: "runtime-core",
      occurredAt: new Date("2026-07-05T00:00:00.000Z"),
      payload: { workflowId: "workflow-1" },
    });

    await eventBus.publish(event);

    expect(received).toEqual([event]);
  });
});
