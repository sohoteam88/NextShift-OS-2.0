import { describe, expect, it } from "vitest";
import { createRuntimeEvent, isRuntimeEvent } from "@nextshift/runtime-core";

describe("RuntimeEvent", () => {
  it("can be created and validated", () => {
    const occurredAt = new Date("2026-07-05T00:00:00.000Z");

    const event = createRuntimeEvent({
      id: "runtime-event-1",
      type: "runtime.workflow.started",
      source: "runtime-core",
      occurredAt,
      payload: { workflowId: "workflow-1" },
      context: {
        executionId: "execution-1",
        workspaceId: "workspace-1",
      },
    });

    expect(event.eventType).toBe("runtime.workflow.started");
    expect(event.occurredAt).toBe(occurredAt);
    expect(isRuntimeEvent(event)).toBe(true);
  });
});
