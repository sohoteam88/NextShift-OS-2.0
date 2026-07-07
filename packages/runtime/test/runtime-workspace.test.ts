import { describe, expect, it } from "vitest";
import {
  RuntimeWorkspaceError,
  activateRuntimeWorkspace,
  closeRuntimeWorkspace,
  createRuntimeContext,
  createRuntimeSession,
  createRuntimeWorkspace,
  isRuntimeWorkspace,
  snapshotRuntimeWorkspace,
  suspendRuntimeWorkspace,
} from "@nextshift/runtime";

describe("RuntimeWorkspace", () => {
  it("creates runtime workspaces with identity and metadata", () => {
    const createdAt = new Date("2026-07-07T10:00:00.000Z");
    const workspace = createRuntimeWorkspace({
      id: "workspace-runtime-1",
      identity: {
        workspaceId: "workspace-1",
        kind: "team",
        ownerId: "owner-1",
      },
      createdAt,
      metadata: { release: "OS-3.3" },
    });

    expect(workspace).toMatchObject({
      id: "workspace-runtime-1",
      identity: {
        workspaceId: "workspace-1",
        kind: "team",
        ownerId: "owner-1",
      },
      state: "created",
      createdAt,
      metadata: { release: "OS-3.3" },
    });
    expect(isRuntimeWorkspace(workspace)).toBe(true);
    expect(Object.isFrozen(workspace)).toBe(true);
    expect(Object.isFrozen(workspace.identity)).toBe(true);
  });

  it("binds workspaces to workspace-scoped runtime context", () => {
    const context = createRuntimeContext({
      id: "context-workspace",
      scope: "workspace",
      correlationId: "correlation-1",
      rootId: "context-root",
    });

    const workspace = createRuntimeWorkspace({
      id: "workspace-runtime-1",
      identity: {
        workspaceId: "workspace-1",
        kind: "organization",
      },
      context,
    });

    expect(workspace.contextId).toBe("context-workspace");
    expect(workspace.correlationId).toBe("correlation-1");
    expect(workspace.rootContextId).toBe("context-root");
  });

  it("binds workspaces to matching runtime sessions", () => {
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

    expect(workspace.sessionId).toBe("session-1");
    expect(workspace.principalId).toBe("principal-1");
  });

  it("prevents workspaces from using non-workspace runtime contexts", () => {
    const context = createRuntimeContext({
      id: "context-session",
      scope: "session",
      correlationId: "correlation-1",
    });

    expect(() =>
      createRuntimeWorkspace({
        id: "workspace-runtime-1",
        identity: {
          workspaceId: "workspace-1",
          kind: "team",
        },
        context,
      })
    ).toThrow(RuntimeWorkspaceError);
    expect(() =>
      createRuntimeWorkspace({
        id: "workspace-runtime-1",
        identity: {
          workspaceId: "workspace-1",
          kind: "team",
        },
        context,
      })
    ).toThrow("Runtime workspaces require a workspace-scoped runtime context.");
  });

  it("prevents mismatched session workspace identity", () => {
    const session = createRuntimeSession({
      id: "session-1",
      identity: {
        principalId: "principal-1",
        principalType: "human",
        workspaceId: "workspace-2",
      },
    });

    expect(() =>
      createRuntimeWorkspace({
        id: "workspace-runtime-1",
        identity: {
          workspaceId: "workspace-1",
          kind: "team",
        },
        session,
      })
    ).toThrow(RuntimeWorkspaceError);
    expect(() =>
      createRuntimeWorkspace({
        id: "workspace-runtime-1",
        identity: {
          workspaceId: "workspace-1",
          kind: "team",
        },
        session,
      })
    ).toThrow("Runtime workspace session identity does not match workspace identity.");
  });

  it("transitions workspace lifecycle deterministically", () => {
    const workspace = createRuntimeWorkspace({
      id: "workspace-runtime-1",
      identity: {
        workspaceId: "workspace-1",
        kind: "team",
      },
      createdAt: new Date("2026-07-07T10:00:00.000Z"),
    });

    const active = activateRuntimeWorkspace(workspace, {
      now: new Date("2026-07-07T10:01:00.000Z"),
    });
    const suspended = suspendRuntimeWorkspace(active, {
      now: new Date("2026-07-07T10:02:00.000Z"),
    });
    const reactivated = activateRuntimeWorkspace(suspended, {
      now: new Date("2026-07-07T10:03:00.000Z"),
      metadata: { resumed: true },
    });

    expect(active.state).toBe("active");
    expect(active.activatedAt).toEqual(new Date("2026-07-07T10:01:00.000Z"));
    expect(suspended.state).toBe("suspended");
    expect(suspended.suspendedAt).toEqual(new Date("2026-07-07T10:02:00.000Z"));
    expect(reactivated.state).toBe("active");
    expect(reactivated.activatedAt).toEqual(new Date("2026-07-07T10:03:00.000Z"));
    expect(reactivated.metadata).toEqual({ resumed: true });
  });

  it("prevents invalid workspace lifecycle transitions", () => {
    const workspace = createRuntimeWorkspace({
      id: "workspace-runtime-1",
      identity: {
        workspaceId: "workspace-1",
        kind: "team",
      },
    });

    expect(() => suspendRuntimeWorkspace(workspace)).toThrow(RuntimeWorkspaceError);
    expect(() => suspendRuntimeWorkspace(workspace)).toThrow(
      "Runtime workspace cannot transition from created to suspended."
    );

    const closed = closeRuntimeWorkspace(workspace);

    expect(() => activateRuntimeWorkspace(closed)).toThrow(RuntimeWorkspaceError);
    expect(() => activateRuntimeWorkspace(closed)).toThrow(
      "Runtime workspace cannot transition from closed to active."
    );
  });

  it("creates immutable workspace snapshots", () => {
    const workspace = activateRuntimeWorkspace(
      createRuntimeWorkspace({
        id: "workspace-runtime-1",
        identity: {
          workspaceId: "workspace-1",
          kind: "system",
        },
        createdAt: new Date("2026-07-07T10:00:00.000Z"),
        metadata: { source: "test" },
      }),
      { now: new Date("2026-07-07T10:01:00.000Z") }
    );

    const snapshot = snapshotRuntimeWorkspace(workspace);

    expect(snapshot).toEqual({
      id: "workspace-runtime-1",
      identity: {
        workspaceId: "workspace-1",
        kind: "system",
      },
      state: "active",
      contextId: undefined,
      correlationId: undefined,
      rootContextId: undefined,
      sessionId: undefined,
      principalId: undefined,
      createdAt: "2026-07-07T10:00:00.000Z",
      activatedAt: "2026-07-07T10:01:00.000Z",
      suspendedAt: undefined,
      closedAt: undefined,
      metadata: { source: "test" },
    });
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.identity)).toBe(true);
  });

  it("rejects invalid workspace identity", () => {
    expect(() =>
      createRuntimeWorkspace({
        id: "workspace-runtime-1",
        identity: {
          workspaceId: " ",
          kind: "team",
        },
      })
    ).toThrow("Runtime workspace identity is invalid.");
  });

  it("rejects forbidden metadata keys", () => {
    expect(() =>
      createRuntimeWorkspace({
        id: "workspace-runtime-1",
        identity: {
          workspaceId: "workspace-1",
          kind: "team",
        },
        metadata: { apiKey: "do-not-store" },
      })
    ).toThrow(RuntimeWorkspaceError);
    expect(() =>
      createRuntimeWorkspace({
        id: "workspace-runtime-1",
        identity: {
          workspaceId: "workspace-1",
          kind: "team",
        },
        metadata: { apiKey: "do-not-store" },
      })
    ).toThrow("Runtime workspace metadata contains a forbidden key.");
  });

  it("identifies invalid runtime workspace candidates", () => {
    expect(
      isRuntimeWorkspace({
        id: "workspace-runtime-1",
        identity: {
          workspaceId: "workspace-1",
          kind: "team",
        },
        state: "active",
        createdAt: "2026-07-07T10:00:00.000Z",
      })
    ).toBe(false);
  });
});
