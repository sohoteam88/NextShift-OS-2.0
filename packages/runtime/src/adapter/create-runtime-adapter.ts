export type RuntimeAdapterMode = "legacy" | "runtime";

export type RuntimeAdapterLogger = Pick<Console, "warn">;

export type RuntimeAdapterBaseMetadata<
  TSource extends string,
  TConfidence,
  TWarning extends string,
> = {
  enabled: boolean;
  mode: RuntimeAdapterMode;
  source: TSource;
  fallback: boolean;
  confidence: TConfidence;
  contextId?: string;
  correlationId?: string;
  capabilityId?: string;
  capabilityRuntimeId?: string;
  eventId?: string;
  eventType?: string;
  diagnosticsId?: string;
  diagnosticsStatus?: string;
  warning?: TWarning;
  errorKind?: string;
};

export type RuntimeAdapterWarningPayload<
  TInput,
  TLegacyOutput,
  TWarning extends string,
> = {
  input: TInput;
  legacyOutput: TLegacyOutput;
  warning: TWarning;
  errorKind?: string;
};

export type RuntimeAdapterConfig<
  TInput,
  TLegacyOutput,
  TSource extends string,
  TConfidence,
  TWarning extends string,
  TMetadata extends RuntimeAdapterBaseMetadata<TSource, TConfidence, TWarning>,
  TOutput,
  TDependencies,
> = {
  resolveLegacy: (
    input: TInput,
    dependencies: TDependencies,
  ) => TLegacyOutput | Promise<TLegacyOutput>;
  isEnabled: (
    input: TInput,
    legacyOutput: TLegacyOutput,
    dependencies: TDependencies,
  ) => boolean;
  getSource: (
    input: TInput,
    legacyOutput: TLegacyOutput,
    dependencies: TDependencies,
  ) => TSource;
  getConfidence: (
    input: TInput,
    legacyOutput: TLegacyOutput,
    dependencies: TDependencies,
  ) => TConfidence;
  getFallbackConfidence?: (
    input: TInput,
    legacyOutput: TLegacyOutput,
    dependencies: TDependencies,
  ) => TConfidence;
  createRuntimeMetadata: (
    input: TInput,
    legacyOutput: TLegacyOutput,
    dependencies: TDependencies,
  ) => Partial<Omit<TMetadata, "enabled" | "mode" | "source" | "fallback" | "confidence">>;
  composeOutput: (legacyOutput: TLegacyOutput, runtime: TMetadata) => TOutput;
  fallbackWarning: TWarning;
  invalidOutputWarning: TWarning;
  warningLogMessage: string;
  getLogger?: (dependencies: TDependencies) => RuntimeAdapterLogger | undefined;
  createWarningPayload: (
    payload: RuntimeAdapterWarningPayload<TInput, TLegacyOutput, TWarning>,
  ) => Record<string, unknown>;
  validateRuntimeMetadata?: (metadata: TMetadata) => boolean;
  classifyError?: (error: unknown) => string;
};

export function createRuntimeAdapter<
  TInput,
  TLegacyOutput,
  TSource extends string,
  TConfidence,
  TWarning extends string,
  TMetadata extends RuntimeAdapterBaseMetadata<TSource, TConfidence, TWarning>,
  TOutput,
  TDependencies = Record<string, never>,
>(
  config: RuntimeAdapterConfig<
    TInput,
    TLegacyOutput,
    TSource,
    TConfidence,
    TWarning,
    TMetadata,
    TOutput,
    TDependencies
  >,
) {
  return {
    resolve(input: TInput, dependencies = {} as TDependencies): TOutput {
      const legacyOutput = config.resolveLegacy(input, dependencies);

      if (isPromiseLike(legacyOutput)) {
        throw new TypeError("Runtime adapter sync resolve received an async legacy resolver.");
      }

      return resolveWithLegacy(input, legacyOutput, dependencies, config);
    },

    async resolveAsync(input: TInput, dependencies = {} as TDependencies): Promise<TOutput> {
      const legacyOutput = await config.resolveLegacy(input, dependencies);
      return resolveWithLegacy(input, legacyOutput, dependencies, config);
    },
  };
}

function resolveWithLegacy<
  TInput,
  TLegacyOutput,
  TSource extends string,
  TConfidence,
  TWarning extends string,
  TMetadata extends RuntimeAdapterBaseMetadata<TSource, TConfidence, TWarning>,
  TOutput,
  TDependencies,
>(
  input: TInput,
  legacyOutput: TLegacyOutput,
  dependencies: TDependencies,
  config: RuntimeAdapterConfig<
    TInput,
    TLegacyOutput,
    TSource,
    TConfidence,
    TWarning,
    TMetadata,
    TOutput,
    TDependencies
  >,
) {
  const source = config.getSource(input, legacyOutput, dependencies);
  const confidence = config.getConfidence(input, legacyOutput, dependencies);

  if (!config.isEnabled(input, legacyOutput, dependencies)) {
    return config.composeOutput(
      legacyOutput,
      createDisabledMetadata(source, confidence),
    );
  }

  try {
    const runtime = {
      enabled: true,
      mode: "runtime",
      source,
      fallback: false,
      confidence,
      ...config.createRuntimeMetadata(input, legacyOutput, dependencies),
    } as TMetadata;

    if (!validateRuntimeMetadata(runtime, config.validateRuntimeMetadata)) {
      warnRuntimeFallback(input, legacyOutput, dependencies, config, config.invalidOutputWarning);
      return config.composeOutput(
        legacyOutput,
        createFallbackMetadata(input, legacyOutput, dependencies, config, config.invalidOutputWarning),
      );
    }

    return config.composeOutput(legacyOutput, runtime);
  } catch (error) {
    const errorKind = (config.classifyError ?? classifyRuntimeAdapterError)(error);
    warnRuntimeFallback(
      input,
      legacyOutput,
      dependencies,
      config,
      config.fallbackWarning,
      errorKind,
    );
    return config.composeOutput(
      legacyOutput,
      createFallbackMetadata(
        input,
        legacyOutput,
        dependencies,
        config,
        config.fallbackWarning,
        errorKind,
      ),
    );
  }
}

function createDisabledMetadata<
  TSource extends string,
  TConfidence,
  TWarning extends string,
  TMetadata extends RuntimeAdapterBaseMetadata<TSource, TConfidence, TWarning>,
>(source: TSource, confidence: TConfidence): TMetadata {
  return {
    enabled: false,
    mode: "legacy",
    source,
    fallback: false,
    confidence,
  } as TMetadata;
}

function createFallbackMetadata<
  TInput,
  TLegacyOutput,
  TSource extends string,
  TConfidence,
  TWarning extends string,
  TMetadata extends RuntimeAdapterBaseMetadata<TSource, TConfidence, TWarning>,
  TOutput,
  TDependencies,
>(
  input: TInput,
  legacyOutput: TLegacyOutput,
  dependencies: TDependencies,
  config: RuntimeAdapterConfig<
    TInput,
    TLegacyOutput,
    TSource,
    TConfidence,
    TWarning,
    TMetadata,
    TOutput,
    TDependencies
  >,
  warning: TWarning,
  errorKind?: string,
): TMetadata {
  const runtime = {
    enabled: true,
    mode: "legacy",
    source: config.getSource(input, legacyOutput, dependencies),
    fallback: true,
    confidence: (config.getFallbackConfidence ?? config.getConfidence)(
      input,
      legacyOutput,
      dependencies,
    ),
    diagnosticsStatus: "degraded",
    warning,
  } as TMetadata;

  if (errorKind) runtime.errorKind = errorKind;

  return runtime;
}

function warnRuntimeFallback<
  TInput,
  TLegacyOutput,
  TSource extends string,
  TConfidence,
  TWarning extends string,
  TMetadata extends RuntimeAdapterBaseMetadata<TSource, TConfidence, TWarning>,
  TOutput,
  TDependencies,
>(
  input: TInput,
  legacyOutput: TLegacyOutput,
  dependencies: TDependencies,
  config: RuntimeAdapterConfig<
    TInput,
    TLegacyOutput,
    TSource,
    TConfidence,
    TWarning,
    TMetadata,
    TOutput,
    TDependencies
  >,
  warning: TWarning,
  errorKind?: string,
) {
  const logger = config.getLogger?.(dependencies) ?? console;
  logger.warn(
    config.warningLogMessage,
    config.createWarningPayload({ input, legacyOutput, warning, errorKind }),
  );
}

function validateRuntimeMetadata<
  TSource extends string,
  TConfidence,
  TWarning extends string,
  TMetadata extends RuntimeAdapterBaseMetadata<TSource, TConfidence, TWarning>,
>(
  metadata: TMetadata,
  validate?: (metadata: TMetadata) => boolean,
) {
  if (validate) return validate(metadata);

  return Boolean(
    metadata.contextId &&
      metadata.correlationId &&
      metadata.capabilityId &&
      metadata.capabilityRuntimeId &&
      metadata.eventId &&
      metadata.eventType &&
      metadata.diagnosticsId &&
      metadata.diagnosticsStatus,
  );
}

function classifyRuntimeAdapterError(error: unknown) {
  if (error instanceof Error && error.constructor.name.trim()) {
    return error.constructor.name;
  }

  return "unknown";
}

function isPromiseLike<T>(value: T | Promise<T>): value is Promise<T> {
  return Boolean(
    value &&
      typeof value === "object" &&
      "then" in value &&
      typeof (value as Promise<T>).then === "function",
  );
}
