import { describe, expect, it } from "vitest";
import {
  RuntimeKernelError,
  createRuntimeKernel,
} from "@nextshift/runtime";

describe("RuntimeKernel", () => {
  it("creates a runtime kernel with metadata", () => {
    const createdAt = new Date("2026-07-07T00:00:00.000Z");
    const kernel = createRuntimeKernel({
      metadata: {
        id: "runtime-1",
        name: "Runtime Platform",
        version: "1.0.0",
        createdAt,
      },
    });

    expect(kernel.state).toBe("created");
    expect(kernel.metadata).toEqual({
      id: "runtime-1",
      name: "Runtime Platform",
      version: "1.0.0",
      createdAt,
    });
  });

  it("assigns updated metadata without replacing omitted fields", () => {
    const kernel = createRuntimeKernel({
      metadata: {
        id: "runtime-1",
        name: "Runtime Platform",
        version: "1.0.0",
        labels: { track: "os-3.3" },
      },
    });

    const metadata = kernel.assignMetadata({
      version: "1.0.1",
      labels: { track: "os-3.3", slice: "RP-001" },
    });

    expect(metadata.id).toBe("runtime-1");
    expect(metadata.name).toBe("Runtime Platform");
    expect(metadata.version).toBe("1.0.1");
    expect(metadata.labels).toEqual({ track: "os-3.3", slice: "RP-001" });
  });

  it("initializes and reports healthy running state", () => {
    const initializedAt = new Date("2026-07-07T01:00:00.000Z");
    const kernel = createRuntimeKernel();

    const health = kernel.initialize(initializedAt);

    expect(kernel.state).toBe("running");
    expect(health).toMatchObject({
      state: "running",
      healthy: true,
      initializedAt,
    });
  });

  it("shuts down a running kernel", () => {
    const stoppedAt = new Date("2026-07-07T02:00:00.000Z");
    const kernel = createRuntimeKernel();

    kernel.initialize();
    const health = kernel.shutdown(stoppedAt);

    expect(kernel.state).toBe("stopped");
    expect(health).toMatchObject({
      state: "stopped",
      healthy: false,
      stoppedAt,
    });
  });

  it("prevents invalid lifecycle transitions", () => {
    const kernel = createRuntimeKernel();

    expect(() => kernel.shutdown()).toThrow(RuntimeKernelError);
    expect(() => kernel.shutdown()).toThrow(
      "Invalid runtime kernel transition from created to stopping."
    );
  });

  it("prevents transitions after shutdown", () => {
    const kernel = createRuntimeKernel();

    kernel.initialize();
    kernel.shutdown();

    expect(() => kernel.initialize()).toThrow(RuntimeKernelError);
    expect(() => kernel.initialize()).toThrow(
      "Runtime kernel cannot transition from stopped to initializing."
    );
  });

  it("records failed state and typed runtime errors", () => {
    const failedAt = new Date("2026-07-07T03:00:00.000Z");
    const kernel = createRuntimeKernel();

    kernel.initialize();
    const health = kernel.fail("runtime boundary failed", failedAt);

    expect(health.state).toBe("failed");
    expect(health.healthy).toBe(false);
    expect(health.failedAt).toBe(failedAt);
    expect(health.lastError).toBeInstanceOf(RuntimeKernelError);
    expect(health.lastError?.code).toBe("RUNTIME_KERNEL_INVALID_TRANSITION");
  });

  it("prevents failure after shutdown", () => {
    const kernel = createRuntimeKernel();

    kernel.initialize();
    kernel.shutdown();

    expect(() => kernel.fail("late failure")).toThrow(RuntimeKernelError);
    expect(() => kernel.fail("late failure")).toThrow(
      "Stopped runtime kernels cannot be failed."
    );
  });
});
