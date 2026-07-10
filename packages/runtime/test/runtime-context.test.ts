import { describe, expect, it } from "vitest";
import {
  RuntimeContextError,
  createRuntimeContext,
  deriveRuntimeContext,
  isRuntimeContext,
  snapshotRuntimeContext,
} from "@nextshift/runtime";

describe("RuntimeContext", () => {
  it("creates runtime contexts with scope and metadata", () => {
    const createdAt = new Date("2026-07-07T08:00:00.000Z");
    const context = createRuntimeContext({
      id: "context-1",
      scope: "kernel",
      correlationId: "correlation-1",
      createdAt,
      metadata: { release: "OS-3.3" },
    });

    expect(context).toMatchObject({
      id: "context-1",
      scope: "kernel",
      correlationId: "correlation-1",
      rootId: "context-1",
      createdAt,
      metadata: { release: "OS-3.3" },
    });
    expect(isRuntimeContext(context)).toBe(true);
  });

  it("derives child contexts while preserving correlation and root identity", () => {
    const parent = createRuntimeContext({
      id: "context-root",
      scope: "workspace",
      correlationId: "correlation-1",
    });

    const child = deriveRuntimeContext(parent, {
      id: "context-child",
      scope: "session",
      metadata: { workspaceId: "workspace-1" },
    });

    expect(child.parentId).toBe(parent.id);
    expect(child.rootId).toBe(parent.rootId);
    expect(child.correlationId).toBe(parent.correlationId);
    expect(child.scope).toBe("session");
    expect(isRuntimeContext(child)).toBe(true);
  });

  it("allows narrowing scope across context boundaries", () => {
    const kernel = createRuntimeContext({
      id: "context-kernel",
      scope: "kernel",
      correlationId: "correlation-1",
    });
    const workspace = deriveRuntimeContext(kernel, {
      id: "context-workspace",
      scope: "workspace",
    });
    const session = deriveRuntimeContext(workspace, {
      id: "context-session",
      scope: "session",
    });
    const capability = deriveRuntimeContext(session, {
      id: "context-capability",
      scope: "capability",
    });
    const event = deriveRuntimeContext(capability, {
      id: "context-event",
      scope: "event",
    });

    expect(event.rootId).toBe("context-kernel");
    expect(event.parentId).toBe("context-capability");
    expect(event.scope).toBe("event");
  });

  it("prevents scope widening during derivation", () => {
    const session = createRuntimeContext({
      id: "context-session",
      scope: "session",
      correlationId: "correlation-1",
    });

    expect(() =>
      deriveRuntimeContext(session, {
        id: "context-workspace",
        scope: "workspace",
      })
    ).toThrow(RuntimeContextError);
    expect(() =>
      deriveRuntimeContext(session, {
        id: "context-workspace",
        scope: "workspace",
      })
    ).toThrow("Runtime context cannot derive workspace from session.");
  });

  it("creates immutable context snapshots", () => {
    const createdAt = new Date("2026-07-07T08:30:00.000Z");
    const context = createRuntimeContext({
      id: "context-1",
      scope: "capability",
      correlationId: "correlation-1",
      parentId: "context-parent",
      rootId: "context-root",
      createdAt,
      metadata: { capabilityId: "capability-1" },
    });

    const snapshot = snapshotRuntimeContext(context);

    expect(snapshot).toEqual({
      id: "context-1",
      scope: "capability",
      correlationId: "correlation-1",
      parentId: "context-parent",
      rootId: "context-root",
      createdAt: "2026-07-07T08:30:00.000Z",
      metadata: { capabilityId: "capability-1" },
    });
    expect(Object.isFrozen(snapshot)).toBe(true);
  });

  it("rejects invalid context scope", () => {
    expect(() =>
      createRuntimeContext({
        id: "context-1",
        scope: "invalid" as never,
      })
    ).toThrow(RuntimeContextError);
  });

  it("rejects empty context identifiers", () => {
    expect(() =>
      createRuntimeContext({
        id: " ",
        scope: "kernel",
      })
    ).toThrow("Runtime context id is required.");
  });

  it("rejects forbidden metadata keys", () => {
    expect(() =>
      createRuntimeContext({
        id: "context-1",
        scope: "kernel",
        metadata: { apiKey: "do-not-store" },
      })
    ).toThrow(RuntimeContextError);
    expect(() =>
      createRuntimeContext({
        id: "context-1",
        scope: "kernel",
        metadata: { apiKey: "do-not-store" },
      })
    ).toThrow("Runtime context metadata contains a forbidden key.");
  });

  it("identifies invalid runtime context candidates", () => {
    expect(
      isRuntimeContext({
        id: "context-1",
        scope: "kernel",
        correlationId: "correlation-1",
        rootId: "context-1",
        createdAt: "2026-07-07T08:00:00.000Z",
      })
    ).toBe(false);
  });
});
