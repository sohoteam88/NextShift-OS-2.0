import { describe, expect, it } from "vitest";
import {
  RuntimePermissionError,
  createRuntimePermission,
  isRuntimePermission,
  isRuntimePermissionDecision,
  isRuntimePermissionScope,
  snapshotRuntimePermission,
} from "@nextshift/runtime";

describe("RuntimePermission", () => {
  it("creates runtime permissions with identity, decision, reason, and metadata", () => {
    const decidedAt = new Date("2026-07-07T13:00:00.000Z");
    const permission = createRuntimePermission({
      id: "runtime-permission-1",
      identity: {
        permissionId: "permission-1",
        subjectId: "principal-1",
        action: "runtime.capability.activate",
        resource: "capability-1",
        scope: "capability",
        workspaceId: "workspace-1",
        capabilityId: "capability-1",
        version: "1.0.0",
      },
      decision: "allow",
      reason: "Runtime capability activation permitted.",
      decidedAt,
      metadata: { release: "OS-3.3" },
    });

    expect(permission).toMatchObject({
      id: "runtime-permission-1",
      identity: {
        permissionId: "permission-1",
        subjectId: "principal-1",
        action: "runtime.capability.activate",
        resource: "capability-1",
        scope: "capability",
        workspaceId: "workspace-1",
        capabilityId: "capability-1",
        version: "1.0.0",
      },
      decision: "allow",
      reason: "Runtime capability activation permitted.",
      decidedAt,
      metadata: { release: "OS-3.3" },
    });
    expect(isRuntimePermission(permission)).toBe(true);
    expect(isRuntimePermissionDecision(permission.decision)).toBe(true);
    expect(isRuntimePermissionScope(permission.identity.scope)).toBe(true);
    expect(Object.isFrozen(permission)).toBe(true);
    expect(Object.isFrozen(permission.identity)).toBe(true);
    expect(Object.isFrozen(permission.metadata)).toBe(true);
  });

  it("supports deny and abstain permission decisions", () => {
    const denied = createRuntimePermission({
      identity: {
        permissionId: "permission-1",
        subjectId: "principal-1",
        action: "runtime.event.dispatch",
        resource: "event-1",
        scope: "event",
      },
      decision: "deny",
    });
    const abstained = createRuntimePermission({
      identity: {
        permissionId: "permission-2",
        subjectId: "system-1",
        action: "runtime.diagnostics.read",
        resource: "diagnostics-1",
        scope: "system",
      },
      decision: "abstain",
    });

    expect(denied.decision).toBe("deny");
    expect(abstained.decision).toBe("abstain");
  });

  it("creates immutable permission snapshots", () => {
    const permission = createRuntimePermission({
      id: "runtime-permission-1",
      identity: {
        permissionId: "permission-1",
        subjectId: "principal-1",
        action: "runtime.workspace.read",
        resource: "workspace-1",
        scope: "workspace",
      },
      decision: "allow",
      decidedAt: new Date("2026-07-07T13:00:00.000Z"),
      metadata: { source: "test" },
    });

    const snapshot = snapshotRuntimePermission(permission);

    expect(snapshot).toEqual({
      id: "runtime-permission-1",
      identity: {
        permissionId: "permission-1",
        subjectId: "principal-1",
        action: "runtime.workspace.read",
        resource: "workspace-1",
        scope: "workspace",
      },
      decision: "allow",
      reason: undefined,
      decidedAt: "2026-07-07T13:00:00.000Z",
      metadata: { source: "test" },
    });
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.identity)).toBe(true);
    expect(Object.isFrozen(snapshot.metadata)).toBe(true);
  });

  it("rejects invalid permission identity", () => {
    expect(() =>
      createRuntimePermission({
        identity: {
          permissionId: " ",
          subjectId: "principal-1",
          action: "runtime.workspace.read",
          resource: "workspace-1",
          scope: "workspace",
        },
        decision: "allow",
      })
    ).toThrow(RuntimePermissionError);
    expect(() =>
      createRuntimePermission({
        identity: {
          permissionId: "permission-1",
          subjectId: "principal-1",
          action: "runtime.workspace.read",
          resource: "workspace-1",
          scope: "invalid",
        },
        decision: "allow",
      })
    ).toThrow("Runtime permission identity is invalid.");
  });

  it("rejects invalid permission decisions", () => {
    expect(isRuntimePermissionDecision("maybe")).toBe(false);
    expect(() =>
      createRuntimePermission({
        identity: {
          permissionId: "permission-1",
          subjectId: "principal-1",
          action: "runtime.workspace.read",
          resource: "workspace-1",
          scope: "workspace",
        },
        decision: "maybe",
      })
    ).toThrow("Runtime permission decision is invalid.");
  });

  it("rejects forbidden metadata keys", () => {
    expect(() =>
      createRuntimePermission({
        identity: {
          permissionId: "permission-1",
          subjectId: "principal-1",
          action: "runtime.workspace.read",
          resource: "workspace-1",
          scope: "workspace",
        },
        decision: "allow",
        metadata: { credential: "do-not-store" },
      })
    ).toThrow("Runtime permission metadata contains a forbidden key.");
  });

  it("identifies invalid runtime permission candidates", () => {
    expect(
      isRuntimePermission({
        id: "runtime-permission-1",
        identity: {
          permissionId: "permission-1",
          subjectId: "principal-1",
          action: "runtime.workspace.read",
          resource: "workspace-1",
          scope: "workspace",
        },
        decision: "allow",
        decidedAt: "2026-07-07T13:00:00.000Z",
      })
    ).toBe(false);
  });
});
