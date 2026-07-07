import { describe, expect, it } from "vitest";
import {
  RuntimeEventError,
  createRuntimeCapability,
  createRuntimeContext,
  createRuntimeEvent,
  createRuntimeSession,
  createRuntimeWorkspace,
  isRuntimeEvent,
  isRuntimeEventType,
  snapshotRuntimeEvent,
} from "@nextshift/runtime";

describe("RuntimeEvent", () => {
  it("creates runtime events with identity, payload, metadata, and timestamp", () => {
    const occurredAt = new Date("2026-07-07T12:00:00.000Z");
    const event = createRuntimeEvent({
      id: "runtime-event-1",
      identity: {
        eventId: "event-1",
        type: "capability.registered",
        source: "runtime",
        workspaceId: "workspace-1",
        capabilityId: "capability-1",
        version: "1.0.0",
      },
      occurredAt,
      payload: { state: "registered" },
      metadata: { release: "OS-3.3" },
    });

    expect(event).toMatchObject({
      id: "runtime-event-1",
      identity: {
        eventId: "event-1",
        type: "capability.registered",
        source: "runtime",
        workspaceId: "workspace-1",
        capabilityId: "capability-1",
        version: "1.0.0",
      },
      payload: { state: "registered" },
      occurredAt,
      metadata: { release: "OS-3.3" },
    });
    expect(isRuntimeEvent(event)).toBe(true);
    expect(isRuntimeEventType(event.identity.type)).toBe(true);
    expect(Object.isFrozen(event)).toBe(true);
    expect(Object.isFrozen(event.identity)).toBe(true);
    expect(Object.isFrozen(event.payload)).toBe(true);
  });

  it("binds events to event-scoped runtime context", () => {
    const context = createRuntimeContext({
      id: "context-event",
      scope: "event",
      correlationId: "correlation-1",
      rootId: "context-root",
    });

    const event = createRuntimeEvent({
      id: "runtime-event-1",
      identity: {
        eventId: "event-1",
        type: "runtime.event-created",
        source: "runtime",
      },
      context,
    });

    expect(event.contextId).toBe("context-event");
    expect(event.correlationId).toBe("correlation-1");
    expect(event.rootContextId).toBe("context-root");
  });

  it("binds events to matching workspace, session, and capability identities", () => {
    const session = createRuntimeSession({
      id: "session-1",
      identity: {
        principalId: "principal-1",
        principalType: "human",
        workspaceId: "workspace-1",
      },
    });
    const workspace = createRuntimeWorkspace({
      id: "workspace-runtime-1",
      identity: {
        workspaceId: "workspace-1",
        kind: "team",
      },
      session,
    });
    const capability = createRuntimeCapability({
      id: "capability-runtime-1",
      identity: {
        capabilityId: "capability-1",
        kind: "workflow",
        workspaceId: "workspace-1",
      },
      workspace,
      session,
    });

    const event = createRuntimeEvent({
      id: "runtime-event-1",
      identity: {
        eventId: "event-1",
        type: "capability.activated",
        source: "runtime",
        workspaceId: "workspace-1",
        capabilityId: "capability-1",
      },
      workspace,
      session,
      capability,
    });

    expect(event.workspaceRuntimeId).toBe("workspace-runtime-1");
    expect(event.sessionId).toBe("session-1");
    expect(event.principalId).toBe("principal-1");
    expect(event.capabilityRuntimeId).toBe("capability-runtime-1");
  });

  it("prevents events from using non-event runtime contexts", () => {
    const context = createRuntimeContext({
      id: "context-capability",
      scope: "capability",
      correlationId: "correlation-1",
    });

    expect(() =>
      createRuntimeEvent({
        id: "runtime-event-1",
        identity: {
          eventId: "event-1",
          type: "capability.registered",
          source: "runtime",
        },
        context,
      })
    ).toThrow(RuntimeEventError);
    expect(() =>
      createRuntimeEvent({
        id: "runtime-event-1",
        identity: {
          eventId: "event-1",
          type: "capability.registered",
          source: "runtime",
        },
        context,
      })
    ).toThrow("Runtime events require an event-scoped runtime context.");
  });

  it("prevents mismatched workspace identity", () => {
    const workspace = createRuntimeWorkspace({
      id: "workspace-runtime-1",
      identity: {
        workspaceId: "workspace-2",
        kind: "team",
      },
    });

    expect(() =>
      createRuntimeEvent({
        id: "runtime-event-1",
        identity: {
          eventId: "event-1",
          type: "workspace.updated",
          source: "runtime",
          workspaceId: "workspace-1",
        },
        workspace,
      })
    ).toThrow(RuntimeEventError);
    expect(() =>
      createRuntimeEvent({
        id: "runtime-event-1",
        identity: {
          eventId: "event-1",
          type: "workspace.updated",
          source: "runtime",
          workspaceId: "workspace-1",
        },
        workspace,
      })
    ).toThrow("Runtime event identity does not match workspace identity.");
  });

  it("prevents mismatched session identity", () => {
    const session = createRuntimeSession({
      id: "session-1",
      identity: {
        principalId: "principal-1",
        principalType: "human",
        workspaceId: "workspace-2",
      },
    });

    expect(() =>
      createRuntimeEvent({
        id: "runtime-event-1",
        identity: {
          eventId: "event-1",
          type: "session.observed",
          source: "runtime",
          workspaceId: "workspace-1",
        },
        session,
      })
    ).toThrow(RuntimeEventError);
    expect(() =>
      createRuntimeEvent({
        id: "runtime-event-1",
        identity: {
          eventId: "event-1",
          type: "session.observed",
          source: "runtime",
          workspaceId: "workspace-1",
        },
        session,
      })
    ).toThrow("Runtime event session identity does not match event identity.");
  });

  it("prevents mismatched capability identity", () => {
    const capability = createRuntimeCapability({
      id: "capability-runtime-1",
      identity: {
        capabilityId: "capability-2",
        kind: "workflow",
        workspaceId: "workspace-1",
      },
    });

    expect(() =>
      createRuntimeEvent({
        id: "runtime-event-1",
        identity: {
          eventId: "event-1",
          type: "capability.activated",
          source: "runtime",
          workspaceId: "workspace-1",
          capabilityId: "capability-1",
        },
        capability,
      })
    ).toThrow(RuntimeEventError);
    expect(() =>
      createRuntimeEvent({
        id: "runtime-event-1",
        identity: {
          eventId: "event-1",
          type: "capability.activated",
          source: "runtime",
          workspaceId: "workspace-1",
          capabilityId: "capability-1",
        },
        capability,
      })
    ).toThrow("Runtime event identity does not match capability identity.");
  });

  it("creates immutable event snapshots", () => {
    const event = createRuntimeEvent({
      id: "runtime-event-1",
      identity: {
        eventId: "event-1",
        type: "runtime.event-created",
        source: "runtime",
      },
      occurredAt: new Date("2026-07-07T12:00:00.000Z"),
      payload: { status: "created" },
      metadata: { source: "test" },
    });

    const snapshot = snapshotRuntimeEvent(event);

    expect(snapshot).toEqual({
      id: "runtime-event-1",
      identity: {
        eventId: "event-1",
        type: "runtime.event-created",
        source: "runtime",
      },
      payload: { status: "created" },
      contextId: undefined,
      correlationId: undefined,
      rootContextId: undefined,
      workspaceRuntimeId: undefined,
      sessionId: undefined,
      principalId: undefined,
      capabilityRuntimeId: undefined,
      occurredAt: "2026-07-07T12:00:00.000Z",
      metadata: { source: "test" },
    });
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.identity)).toBe(true);
    expect(Object.isFrozen(snapshot.payload)).toBe(true);
  });

  it("rejects invalid event identity", () => {
    expect(() =>
      createRuntimeEvent({
        id: "runtime-event-1",
        identity: {
          eventId: " ",
          type: "runtime.event-created",
          source: "runtime",
        },
      })
    ).toThrow("Runtime event identity is invalid.");
  });

  it("rejects invalid event type", () => {
    expect(isRuntimeEventType("Runtime Event")).toBe(false);
    expect(() =>
      createRuntimeEvent({
        id: "runtime-event-1",
        identity: {
          eventId: "event-1",
          type: "Runtime Event",
          source: "runtime",
        },
      })
    ).toThrow("Runtime event identity is invalid.");
  });

  it("rejects forbidden payload and metadata keys", () => {
    expect(() =>
      createRuntimeEvent({
        id: "runtime-event-1",
        identity: {
          eventId: "event-1",
          type: "runtime.event-created",
          source: "runtime",
        },
        payload: { token: "do-not-store" },
      })
    ).toThrow("Runtime event payload contains a forbidden key.");
    expect(() =>
      createRuntimeEvent({
        id: "runtime-event-1",
        identity: {
          eventId: "event-1",
          type: "runtime.event-created",
          source: "runtime",
        },
        metadata: { apiKey: "do-not-store" },
      })
    ).toThrow("Runtime event metadata contains a forbidden key.");
  });

  it("identifies invalid runtime event candidates", () => {
    expect(
      isRuntimeEvent({
        id: "runtime-event-1",
        identity: {
          eventId: "event-1",
          type: "runtime.event-created",
          source: "runtime",
        },
        occurredAt: "2026-07-07T12:00:00.000Z",
      })
    ).toBe(false);
  });
});
