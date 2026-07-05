import { describe, expect, it } from "vitest";
import { EventBusPublishError, InMemoryEventBus } from "@nextshift/event-bus";
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

  it("delivers one event to multiple subscribers", async () => {
    const eventBus = new InMemoryEventBus<RuntimeEvent>();
    const received: string[] = [];
    const event = createRuntimeEvent({
      id: "runtime-event-1",
      type: "runtime.workflow.started",
      source: "runtime-core",
      occurredAt: new Date("2026-07-05T00:00:00.000Z"),
      payload: { workflowId: "workflow-1" },
    });

    eventBus.subscribe(event.eventType, () => {
      received.push("first");
    });
    eventBus.subscribe(event.eventType, () => {
      received.push("second");
    });

    await eventBus.publish(event);

    expect(received).toEqual(["first", "second"]);
  });

  it("continues dispatching when one handler throws", async () => {
    const eventBus = new InMemoryEventBus<RuntimeEvent>();
    const received: string[] = [];
    const event = createRuntimeEvent({
      id: "runtime-event-1",
      type: "runtime.workflow.started",
      source: "runtime-core",
      occurredAt: new Date("2026-07-05T00:00:00.000Z"),
      payload: { workflowId: "workflow-1" },
    });

    eventBus.subscribe(event.eventType, () => {
      throw new Error("handler failed");
    });
    eventBus.subscribe(event.eventType, () => {
      received.push("second");
    });

    await expect(eventBus.publish(event)).rejects.toMatchObject({
      name: "EventBusPublishError",
      failures: [
        {
          eventType: event.eventType,
          handlerIndex: 0,
        },
      ],
    } satisfies Partial<EventBusPublishError>);
    expect(received).toEqual(["second"]);
  });
});
