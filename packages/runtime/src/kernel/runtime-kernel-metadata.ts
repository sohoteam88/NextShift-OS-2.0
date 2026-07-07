export interface RuntimeKernelMetadata {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly createdAt: Date;
  readonly labels?: Readonly<Record<string, string>>;
  readonly attributes?: Readonly<Record<string, unknown>>;
}

export interface CreateRuntimeKernelMetadataInput {
  readonly id?: string;
  readonly name?: string;
  readonly version?: string;
  readonly createdAt?: Date;
  readonly labels?: Readonly<Record<string, string>>;
  readonly attributes?: Readonly<Record<string, unknown>>;
}

export function createRuntimeKernelMetadata(
  input: CreateRuntimeKernelMetadataInput = {}
): RuntimeKernelMetadata {
  return {
    id: input.id ?? crypto.randomUUID(),
    name: input.name ?? "nextshift-runtime",
    version: input.version ?? "0.1.0-alpha",
    createdAt: input.createdAt ?? new Date(),
    labels: input.labels,
    attributes: input.attributes,
  };
}
