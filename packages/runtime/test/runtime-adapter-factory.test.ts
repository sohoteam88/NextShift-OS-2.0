import { describe, expect, it, vi } from "vitest";
import {
  createRuntimeAdapter,
  type RuntimeAdapterBaseMetadata,
} from "@nextshift/runtime";

type TestInput = {
  route: string;
  source: "unit-test";
};

type TestLegacyOutput = {
  status: "resolved";
};

type TestWarning = "runtime-adapter-fallback" | "runtime-adapter-invalid-output";

type TestRuntimeMetadata = RuntimeAdapterBaseMetadata<
  "unit-test",
  number,
  TestWarning
>;

type TestOutput = {
  legacy: TestLegacyOutput;
  runtime: TestRuntimeMetadata;
};

type TestDependencies = {
  enabled: boolean;
  failRuntime?: boolean;
  logger?: Pick<Console, "warn">;
};

function createTestAdapter() {
  return createRuntimeAdapter<
    TestInput,
    TestLegacyOutput,
    "unit-test",
    number,
    TestWarning,
    TestRuntimeMetadata,
    TestOutput,
    TestDependencies
  >({
    resolveLegacy: () => ({ status: "resolved" }),
    isEnabled: (_input, _legacy, dependencies) => dependencies.enabled,
    getSource: (input) => input.source,
    getConfidence: () => 1,
    createRuntimeMetadata: (_input, _legacy, dependencies) => {
      if (dependencies.failRuntime) throw new Error("runtime unavailable");

      return {
        contextId: "context-1",
        correlationId: "correlation-1",
        capabilityId: "capability-1",
        capabilityRuntimeId: "capability-runtime-1",
        eventId: "event-1",
        eventType: "runtime.test.resolved",
        diagnosticsId: "diagnostics-1",
        diagnosticsStatus: "healthy",
      };
    },
    composeOutput: (legacy, runtime) => ({ legacy, runtime }),
    fallbackWarning: "runtime-adapter-fallback",
    invalidOutputWarning: "runtime-adapter-invalid-output",
    warningLogMessage: "[test-runtime-adapter] falling back",
    getLogger: (dependencies) => dependencies.logger,
    createWarningPayload: ({ input, legacyOutput, warning, errorKind }) => ({
      route: input.route,
      status: legacyOutput.status,
      warning,
      errorKind,
    }),
  });
}

describe("createRuntimeAdapter", () => {
  it("returns legacy metadata when the flag is off", () => {
    const adapter = createTestAdapter();

    const output = adapter.resolve(
      { route: "/dashboard", source: "unit-test" },
      { enabled: false },
    );

    expect(output).toEqual({
      legacy: { status: "resolved" },
      runtime: {
        enabled: false,
        mode: "legacy",
        source: "unit-test",
        fallback: false,
        confidence: 1,
      },
    });
  });

  it("returns runtime metadata when the flag is on", () => {
    const adapter = createTestAdapter();

    const output = adapter.resolve(
      { route: "/dashboard", source: "unit-test" },
      { enabled: true },
    );

    expect(output.runtime).toMatchObject({
      enabled: true,
      mode: "runtime",
      source: "unit-test",
      fallback: false,
      confidence: 1,
      contextId: "context-1",
      eventType: "runtime.test.resolved",
      diagnosticsStatus: "healthy",
    });
  });

  it("falls back to legacy metadata when runtime construction throws", () => {
    const warn = vi.fn();
    const adapter = createTestAdapter();

    const output = adapter.resolve(
      { route: "/dashboard", source: "unit-test" },
      { enabled: true, failRuntime: true, logger: { warn } },
    );

    expect(output.runtime).toEqual({
      enabled: true,
      mode: "legacy",
      source: "unit-test",
      fallback: true,
      confidence: 1,
      diagnosticsStatus: "degraded",
      warning: "runtime-adapter-fallback",
      errorKind: "Error",
    });
    expect(warn).toHaveBeenCalledWith(
      "[test-runtime-adapter] falling back",
      {
        route: "/dashboard",
        status: "resolved",
        warning: "runtime-adapter-fallback",
        errorKind: "Error",
      },
    );
  });
});
