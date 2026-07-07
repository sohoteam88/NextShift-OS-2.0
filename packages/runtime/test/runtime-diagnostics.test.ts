import { describe, expect, it } from "vitest";
import {
  RuntimeDiagnosticsError,
  createRuntimeDiagnostics,
  createRuntimeEvent,
  isRuntimeDiagnostics,
  isRuntimeDiagnosticsHealth,
  isRuntimeDiagnosticsStatus,
  snapshotRuntimeDiagnostics,
} from "@nextshift/runtime";

describe("RuntimeDiagnostics", () => {
  it("creates runtime diagnostics with identity, health, status, and metadata", () => {
    const observedAt = new Date("2026-07-07T13:30:00.000Z");
    const diagnostics = createRuntimeDiagnostics({
      id: "runtime-diagnostics-1",
      identity: {
        diagnosticsId: "diagnostics-1",
        component: "runtime-event",
        scope: "event",
        version: "1.0.0",
      },
      health: "healthy",
      status: "ok",
      message: "Event runtime is accepting in-memory records.",
      observedAt,
      metadata: { release: "OS-3.3" },
    });

    expect(diagnostics).toMatchObject({
      id: "runtime-diagnostics-1",
      identity: {
        diagnosticsId: "diagnostics-1",
        component: "runtime-event",
        scope: "event",
        version: "1.0.0",
      },
      health: "healthy",
      status: "ok",
      message: "Event runtime is accepting in-memory records.",
      observedAt,
      metadata: { release: "OS-3.3" },
    });
    expect(isRuntimeDiagnostics(diagnostics)).toBe(true);
    expect(isRuntimeDiagnosticsHealth(diagnostics.health)).toBe(true);
    expect(isRuntimeDiagnosticsStatus(diagnostics.status)).toBe(true);
    expect(Object.isFrozen(diagnostics)).toBe(true);
    expect(Object.isFrozen(diagnostics.identity)).toBe(true);
    expect(Object.isFrozen(diagnostics.metadata)).toBe(true);
  });

  it("supports degraded and unhealthy diagnostics states", () => {
    const degraded = createRuntimeDiagnostics({
      identity: {
        diagnosticsId: "diagnostics-1",
        component: "runtime-permission",
        scope: "permission",
      },
      health: "degraded",
      status: "warning",
    });
    const unhealthy = createRuntimeDiagnostics({
      identity: {
        diagnosticsId: "diagnostics-2",
        component: "runtime-diagnostics",
        scope: "system",
      },
      health: "unhealthy",
      status: "critical",
    });

    expect(degraded.health).toBe("degraded");
    expect(degraded.status).toBe("warning");
    expect(unhealthy.health).toBe("unhealthy");
    expect(unhealthy.status).toBe("critical");
  });

  it("binds diagnostics to compatible runtime events", () => {
    const event = createRuntimeEvent({
      id: "runtime-event-1",
      identity: {
        eventId: "event-1",
        type: "runtime.diagnostics-observed",
        source: "runtime",
      },
      occurredAt: new Date("2026-07-07T13:20:00.000Z"),
    });

    const diagnostics = createRuntimeDiagnostics({
      id: "runtime-diagnostics-1",
      identity: {
        diagnosticsId: "diagnostics-1",
        component: "runtime-event",
        scope: "event",
      },
      health: "healthy",
      status: "ok",
      observedAt: new Date("2026-07-07T13:30:00.000Z"),
      event,
    });

    expect(diagnostics.eventRuntimeId).toBe("runtime-event-1");
    expect(diagnostics.eventType).toBe("runtime.diagnostics-observed");
  });

  it("creates immutable diagnostics snapshots", () => {
    const diagnostics = createRuntimeDiagnostics({
      id: "runtime-diagnostics-1",
      identity: {
        diagnosticsId: "diagnostics-1",
        component: "runtime-event",
        scope: "event",
      },
      health: "healthy",
      status: "ok",
      observedAt: new Date("2026-07-07T13:30:00.000Z"),
      metadata: { source: "test" },
    });

    const snapshot = snapshotRuntimeDiagnostics(diagnostics);

    expect(snapshot).toEqual({
      id: "runtime-diagnostics-1",
      identity: {
        diagnosticsId: "diagnostics-1",
        component: "runtime-event",
        scope: "event",
      },
      health: "healthy",
      status: "ok",
      message: undefined,
      observedAt: "2026-07-07T13:30:00.000Z",
      eventRuntimeId: undefined,
      eventType: undefined,
      metadata: { source: "test" },
    });
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.identity)).toBe(true);
    expect(Object.isFrozen(snapshot.metadata)).toBe(true);
  });

  it("rejects invalid diagnostics identity, health, and status", () => {
    expect(() =>
      createRuntimeDiagnostics({
        identity: {
          diagnosticsId: " ",
          component: "runtime-event",
          scope: "event",
        },
        health: "healthy",
        status: "ok",
      })
    ).toThrow(RuntimeDiagnosticsError);
    expect(() =>
      createRuntimeDiagnostics({
        identity: {
          diagnosticsId: "diagnostics-1",
          component: "runtime-event",
          scope: "event",
        },
        health: "unknown",
        status: "ok",
      })
    ).toThrow("Runtime diagnostics health is invalid.");
    expect(() =>
      createRuntimeDiagnostics({
        identity: {
          diagnosticsId: "diagnostics-1",
          component: "runtime-event",
          scope: "event",
        },
        health: "healthy",
        status: "unknown",
      })
    ).toThrow("Runtime diagnostics status is invalid.");
  });

  it("rejects invalid compatible event candidates", () => {
    expect(() =>
      createRuntimeDiagnostics({
        identity: {
          diagnosticsId: "diagnostics-1",
          component: "runtime-event",
          scope: "event",
        },
        health: "healthy",
        status: "ok",
        event: {
          id: "runtime-event-1",
          identity: {
            eventId: "event-1",
            type: "runtime.diagnostics-observed",
            source: "runtime",
          },
          occurredAt: "2026-07-07T13:20:00.000Z",
        },
      })
    ).toThrow("Runtime diagnostics event is invalid.");
  });

  it("rejects forbidden metadata keys", () => {
    expect(() =>
      createRuntimeDiagnostics({
        identity: {
          diagnosticsId: "diagnostics-1",
          component: "runtime-event",
          scope: "event",
        },
        health: "healthy",
        status: "ok",
        metadata: { token: "do-not-store" },
      })
    ).toThrow("Runtime diagnostics metadata contains a forbidden key.");
  });

  it("identifies invalid runtime diagnostics candidates", () => {
    expect(
      isRuntimeDiagnostics({
        id: "runtime-diagnostics-1",
        identity: {
          diagnosticsId: "diagnostics-1",
          component: "runtime-event",
          scope: "event",
        },
        health: "healthy",
        status: "ok",
        observedAt: "2026-07-07T13:30:00.000Z",
      })
    ).toBe(false);
  });
});
