import { describe, expect, it } from "vitest";
import {
  createRepositoryHealthEvent,
  StaticBusinessRuntimeAdapter,
  type RepositoryRuntimeAdapter,
} from "@nextshift/runtime-adapters";

const context = {
  executionId: "execution-1",
  workspaceId: "workspace-1",
};

describe("runtime adapters", () => {
  it("allows a repository adapter to emit a health event", async () => {
    const adapter: RepositoryRuntimeAdapter = {
      async emitHealthEvent(runtimeContext) {
        return createRepositoryHealthEvent({
          context: runtimeContext,
          status: "healthy",
          checkedAt: new Date("2026-07-05T00:00:00.000Z"),
        });
      },
    };

    const event = await adapter.emitHealthEvent(context);

    expect(event.eventType).toBe("repository.health");
    expect(event.payload.status).toBe("healthy");
  });

  it("allows a business adapter to return a decision result", async () => {
    const adapter = new StaticBusinessRuntimeAdapter("approved");

    const result = await adapter.decide({
      requestId: "decision-1",
      context,
      action: "archive",
      subject: "audit/template.md",
    });

    expect(result.approved).toBe(true);
    expect(result.decision).toBe("approved");
  });
});
