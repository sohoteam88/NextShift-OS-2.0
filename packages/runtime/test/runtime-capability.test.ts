import { describe, expect, it } from "vitest";
import {
  RuntimeCapabilityError,
  activateRuntimeCapability,
  createRuntimeCapability,
  createRuntimeContext,
  createRuntimeSession,
  createRuntimeWorkspace,
  isRuntimeCapability,
  retireRuntimeCapability,
  snapshotRuntimeCapability,
  suspendRuntimeCapability,
} from "@nextshift/runtime";

describe("RuntimeCapability", () => {
  it("creates runtime capabilities with identity and metadata", () => {
    const registeredAt = new Date("2026-07-07T11:00:00.000Z");
    const capability = createRuntimeCapability({
      id: "capability-runtime-1",
      identity: {
        capabilityId: "capability-1",
        kind: "workflow",
        workspaceId: "workspace-1",
        version: "1.0.0",
      },
      registeredAt,
      metadata: { release: "OS-3.3" },
    });

    expect(capability).toMatchObject({
      id: "capability-runtime-1",
      identity: {
        capabilityId: "capability-1",
        kind: "workflow",
        workspaceId: "workspace-1",
        version: "1.0.0",
      },
      state: "registered",
      registeredAt,
      metadata: { release: "OS-3.3" },
    });
    expect(isRuntimeCapability(capability)).toBe(true);
    expect(Object.isFrozen(capability)).toBe(true);
    expect(Object.isFrozen(capability.identity)).toBe(true);
  });

  it("binds capabilities to capability-scoped runtime context", () => {
    const context = createRuntimeContext({
      id: "context-capability",
      scope: "capability",
      correlationId: "correlation-1",
      rootId: "context-root",
    });

    const capability = createRuntimeCapability({
      id: "capability-runtime-1",
      identity: {
        capabilityId: "capability-1",
        kind: "automation",
      },
      context,
    });

    expect(capability.contextId).toBe("context-capability");
    expect(capability.correlationId).toBe("correlation-1");
    expect(capability.rootContextId).toBe("context-root");
  });

  it("binds capabilities to matching workspace and session identities", () => {
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

    expect(capability.workspaceRuntimeId).toBe("workspace-runtime-1");
    expect(capability.sessionId).toBe("session-1");
    expect(capability.principalId).toBe("principal-1");
  });

  it("prevents capabilities from using non-capability runtime contexts", () => {
    const context = createRuntimeContext({
      id: "context-workspace",
      scope: "workspace",
      correlationId: "correlation-1",
    });

    expect(() =>
      createRuntimeCapability({
        id: "capability-runtime-1",
        identity: {
          capabilityId: "capability-1",
          kind: "workflow",
        },
        context,
      })
    ).toThrow(RuntimeCapabilityError);
    expect(() =>
      createRuntimeCapability({
        id: "capability-runtime-1",
        identity: {
          capabilityId: "capability-1",
          kind: "workflow",
        },
        context,
      })
    ).toThrow("Runtime capabilities require a capability-scoped runtime context.");
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
      createRuntimeCapability({
        id: "capability-runtime-1",
        identity: {
          capabilityId: "capability-1",
          kind: "workflow",
          workspaceId: "workspace-1",
        },
        workspace,
      })
    ).toThrow(RuntimeCapabilityError);
    expect(() =>
      createRuntimeCapability({
        id: "capability-runtime-1",
        identity: {
          capabilityId: "capability-1",
          kind: "workflow",
          workspaceId: "workspace-1",
        },
        workspace,
      })
    ).toThrow("Runtime capability identity does not match workspace identity.");
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
      createRuntimeCapability({
        id: "capability-runtime-1",
        identity: {
          capabilityId: "capability-1",
          kind: "workflow",
          workspaceId: "workspace-1",
        },
        session,
      })
    ).toThrow(RuntimeCapabilityError);
    expect(() =>
      createRuntimeCapability({
        id: "capability-runtime-1",
        identity: {
          capabilityId: "capability-1",
          kind: "workflow",
          workspaceId: "workspace-1",
        },
        session,
      })
    ).toThrow("Runtime capability session identity does not match capability identity.");
  });

  it("transitions capability lifecycle deterministically", () => {
    const capability = createRuntimeCapability({
      id: "capability-runtime-1",
      identity: {
        capabilityId: "capability-1",
        kind: "integration",
      },
      registeredAt: new Date("2026-07-07T11:00:00.000Z"),
    });

    const active = activateRuntimeCapability(capability, {
      now: new Date("2026-07-07T11:01:00.000Z"),
    });
    const suspended = suspendRuntimeCapability(active, {
      now: new Date("2026-07-07T11:02:00.000Z"),
    });
    const reactivated = activateRuntimeCapability(suspended, {
      now: new Date("2026-07-07T11:03:00.000Z"),
      metadata: { resumed: true },
    });

    expect(active.state).toBe("active");
    expect(active.activatedAt).toEqual(new Date("2026-07-07T11:01:00.000Z"));
    expect(suspended.state).toBe("suspended");
    expect(suspended.suspendedAt).toEqual(new Date("2026-07-07T11:02:00.000Z"));
    expect(reactivated.state).toBe("active");
    expect(reactivated.activatedAt).toEqual(new Date("2026-07-07T11:03:00.000Z"));
    expect(reactivated.metadata).toEqual({ resumed: true });
  });

  it("prevents invalid capability lifecycle transitions", () => {
    const capability = createRuntimeCapability({
      id: "capability-runtime-1",
      identity: {
        capabilityId: "capability-1",
        kind: "system",
      },
    });

    expect(() => suspendRuntimeCapability(capability)).toThrow(RuntimeCapabilityError);
    expect(() => suspendRuntimeCapability(capability)).toThrow(
      "Runtime capability cannot transition from registered to suspended."
    );

    const retired = retireRuntimeCapability(capability);

    expect(() => activateRuntimeCapability(retired)).toThrow(RuntimeCapabilityError);
    expect(() => activateRuntimeCapability(retired)).toThrow(
      "Runtime capability cannot transition from retired to active."
    );
  });

  it("creates immutable capability snapshots", () => {
    const capability = activateRuntimeCapability(
      createRuntimeCapability({
        id: "capability-runtime-1",
        identity: {
          capabilityId: "capability-1",
          kind: "system",
        },
        registeredAt: new Date("2026-07-07T11:00:00.000Z"),
        metadata: { source: "test" },
      }),
      { now: new Date("2026-07-07T11:01:00.000Z") }
    );

    const snapshot = snapshotRuntimeCapability(capability);

    expect(snapshot).toEqual({
      id: "capability-runtime-1",
      identity: {
        capabilityId: "capability-1",
        kind: "system",
      },
      state: "active",
      contextId: undefined,
      correlationId: undefined,
      rootContextId: undefined,
      workspaceRuntimeId: undefined,
      sessionId: undefined,
      principalId: undefined,
      registeredAt: "2026-07-07T11:00:00.000Z",
      activatedAt: "2026-07-07T11:01:00.000Z",
      suspendedAt: undefined,
      retiredAt: undefined,
      metadata: { source: "test" },
    });
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.identity)).toBe(true);
  });

  it("rejects invalid capability identity", () => {
    expect(() =>
      createRuntimeCapability({
        id: "capability-runtime-1",
        identity: {
          capabilityId: " ",
          kind: "workflow",
        },
      })
    ).toThrow("Runtime capability identity is invalid.");
  });

  it("rejects forbidden metadata keys", () => {
    expect(() =>
      createRuntimeCapability({
        id: "capability-runtime-1",
        identity: {
          capabilityId: "capability-1",
          kind: "workflow",
        },
        metadata: { token: "do-not-store" },
      })
    ).toThrow(RuntimeCapabilityError);
    expect(() =>
      createRuntimeCapability({
        id: "capability-runtime-1",
        identity: {
          capabilityId: "capability-1",
          kind: "workflow",
        },
        metadata: { token: "do-not-store" },
      })
    ).toThrow("Runtime capability metadata contains a forbidden key.");
  });

  it("identifies invalid runtime capability candidates", () => {
    expect(
      isRuntimeCapability({
        id: "capability-runtime-1",
        identity: {
          capabilityId: "capability-1",
          kind: "workflow",
        },
        state: "active",
        registeredAt: "2026-07-07T11:00:00.000Z",
      })
    ).toBe(false);
  });
});
