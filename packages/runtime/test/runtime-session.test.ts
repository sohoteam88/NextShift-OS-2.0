import { describe, expect, it } from "vitest";
import {
  RuntimeSessionError,
  createRuntimeContext,
  createRuntimeSession,
  expireRuntimeSession,
  isRuntimeSession,
  isRuntimeSessionExpired,
  renewRuntimeSession,
  snapshotRuntimeSession,
} from "@nextshift/runtime";

describe("RuntimeSession", () => {
  it("creates runtime sessions with identity and expiration", () => {
    const createdAt = new Date("2026-07-07T09:00:00.000Z");
    const session = createRuntimeSession({
      id: "session-1",
      identity: {
        principalId: "principal-1",
        principalType: "human",
        workspaceId: "workspace-1",
      },
      createdAt,
      ttlMs: 60_000,
      metadata: { release: "OS-3.3" },
    });

    expect(session).toMatchObject({
      id: "session-1",
      identity: {
        principalId: "principal-1",
        principalType: "human",
        workspaceId: "workspace-1",
      },
      state: "active",
      createdAt,
      expiresAt: new Date("2026-07-07T09:01:00.000Z"),
      metadata: { release: "OS-3.3" },
    });
    expect(isRuntimeSession(session)).toBe(true);
    expect(Object.isFrozen(session)).toBe(true);
    expect(Object.isFrozen(session.identity)).toBe(true);
  });

  it("binds sessions to session-scoped runtime context", () => {
    const context = createRuntimeContext({
      id: "context-session",
      scope: "session",
      correlationId: "correlation-1",
      rootId: "context-root",
    });

    const session = createRuntimeSession({
      id: "session-1",
      identity: {
        principalId: "agent-1",
        principalType: "agent",
      },
      context,
    });

    expect(session.contextId).toBe("context-session");
    expect(session.correlationId).toBe("correlation-1");
    expect(session.rootContextId).toBe("context-root");
  });

  it("prevents sessions from using non-session runtime contexts", () => {
    const context = createRuntimeContext({
      id: "context-workspace",
      scope: "workspace",
      correlationId: "correlation-1",
    });

    expect(() =>
      createRuntimeSession({
        id: "session-1",
        identity: {
          principalId: "principal-1",
          principalType: "human",
        },
        context,
      })
    ).toThrow(RuntimeSessionError);
    expect(() =>
      createRuntimeSession({
        id: "session-1",
        identity: {
          principalId: "principal-1",
          principalType: "human",
        },
        context,
      })
    ).toThrow("Runtime sessions require a session-scoped runtime context.");
  });

  it("renews active sessions while preserving identity and creation time", () => {
    const createdAt = new Date("2026-07-07T09:00:00.000Z");
    const session = createRuntimeSession({
      id: "session-1",
      identity: {
        principalId: "principal-1",
        principalType: "human",
      },
      createdAt,
      ttlMs: 60_000,
    });

    const renewed = renewRuntimeSession(session, {
      now: new Date("2026-07-07T09:00:30.000Z"),
      ttlMs: 120_000,
      metadata: { renewal: "manual" },
    });

    expect(renewed.id).toBe(session.id);
    expect(renewed.identity).toEqual(session.identity);
    expect(renewed.createdAt).toBe(createdAt);
    expect(renewed.state).toBe("renewed");
    expect(renewed.renewedAt).toEqual(new Date("2026-07-07T09:00:30.000Z"));
    expect(renewed.expiresAt).toEqual(new Date("2026-07-07T09:02:30.000Z"));
    expect(renewed.metadata).toEqual({ renewal: "manual" });
  });

  it("detects runtime session expiration", () => {
    const session = createRuntimeSession({
      id: "session-1",
      identity: {
        principalId: "principal-1",
        principalType: "human",
      },
      createdAt: new Date("2026-07-07T09:00:00.000Z"),
      expiresAt: new Date("2026-07-07T09:05:00.000Z"),
    });

    expect(isRuntimeSessionExpired(session, new Date("2026-07-07T09:04:59.999Z"))).toBe(
      false
    );
    expect(isRuntimeSessionExpired(session, new Date("2026-07-07T09:05:00.000Z"))).toBe(
      true
    );
  });

  it("prevents renewal after expiration", () => {
    const session = createRuntimeSession({
      id: "session-1",
      identity: {
        principalId: "principal-1",
        principalType: "human",
      },
      createdAt: new Date("2026-07-07T09:00:00.000Z"),
      expiresAt: new Date("2026-07-07T09:05:00.000Z"),
    });

    expect(() =>
      renewRuntimeSession(session, {
        now: new Date("2026-07-07T09:05:00.000Z"),
      })
    ).toThrow(RuntimeSessionError);
    expect(() =>
      renewRuntimeSession(session, {
        now: new Date("2026-07-07T09:05:00.000Z"),
      })
    ).toThrow("Expired runtime sessions cannot be renewed.");
  });

  it("expires sessions with typed lifecycle transition", () => {
    const session = createRuntimeSession({
      id: "session-1",
      identity: {
        principalId: "principal-1",
        principalType: "human",
      },
      createdAt: new Date("2026-07-07T09:00:00.000Z"),
      ttlMs: 60_000,
    });

    const expired = expireRuntimeSession(session, {
      now: new Date("2026-07-07T09:00:30.000Z"),
    });

    expect(expired.state).toBe("expired");
    expect(expired.expiredAt).toEqual(new Date("2026-07-07T09:00:30.000Z"));
    expect(isRuntimeSessionExpired(expired, new Date("2026-07-07T09:00:31.000Z"))).toBe(
      true
    );
  });

  it("creates immutable runtime session snapshots", () => {
    const session = createRuntimeSession({
      id: "session-1",
      identity: {
        principalId: "principal-1",
        principalType: "system",
      },
      createdAt: new Date("2026-07-07T09:00:00.000Z"),
      expiresAt: new Date("2026-07-07T09:10:00.000Z"),
      metadata: { source: "test" },
    });

    const snapshot = snapshotRuntimeSession(session);

    expect(snapshot).toEqual({
      id: "session-1",
      identity: {
        principalId: "principal-1",
        principalType: "system",
      },
      state: "active",
      contextId: undefined,
      correlationId: undefined,
      rootContextId: undefined,
      createdAt: "2026-07-07T09:00:00.000Z",
      expiresAt: "2026-07-07T09:10:00.000Z",
      renewedAt: undefined,
      expiredAt: undefined,
      metadata: { source: "test" },
    });
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.identity)).toBe(true);
  });

  it("rejects invalid session identity", () => {
    expect(() =>
      createRuntimeSession({
        id: "session-1",
        identity: {
          principalId: " ",
          principalType: "human",
        },
      })
    ).toThrow("Runtime session identity is invalid.");
  });

  it("rejects invalid expiration windows", () => {
    expect(() =>
      createRuntimeSession({
        id: "session-1",
        identity: {
          principalId: "principal-1",
          principalType: "human",
        },
        createdAt: new Date("2026-07-07T09:00:00.000Z"),
        expiresAt: new Date("2026-07-07T09:00:00.000Z"),
      })
    ).toThrow("Runtime session expiresAt must be after createdAt.");
  });

  it("rejects forbidden metadata keys", () => {
    expect(() =>
      createRuntimeSession({
        id: "session-1",
        identity: {
          principalId: "principal-1",
          principalType: "human",
        },
        metadata: { token: "do-not-store" },
      })
    ).toThrow(RuntimeSessionError);
    expect(() =>
      createRuntimeSession({
        id: "session-1",
        identity: {
          principalId: "principal-1",
          principalType: "human",
        },
        metadata: { token: "do-not-store" },
      })
    ).toThrow("Runtime session metadata contains a forbidden key.");
  });

  it("identifies invalid runtime session candidates", () => {
    expect(
      isRuntimeSession({
        id: "session-1",
        identity: {
          principalId: "principal-1",
          principalType: "human",
        },
        state: "active",
        createdAt: "2026-07-07T09:00:00.000Z",
        expiresAt: new Date("2026-07-07T09:10:00.000Z"),
      })
    ).toBe(false);
  });
});
