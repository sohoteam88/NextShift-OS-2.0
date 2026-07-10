import { RuntimeKernelError } from "./runtime-kernel-error";
import {
  createRuntimeKernelMetadata,
  type CreateRuntimeKernelMetadataInput,
  type RuntimeKernelMetadata,
} from "./runtime-kernel-metadata";
import {
  isTerminalRuntimeKernelState,
  type RuntimeKernelState,
} from "./runtime-kernel-state";

export interface RuntimeKernelHealth {
  readonly state: RuntimeKernelState;
  readonly healthy: boolean;
  readonly metadata: RuntimeKernelMetadata;
  readonly initializedAt?: Date;
  readonly stoppedAt?: Date;
  readonly failedAt?: Date;
  readonly lastError?: RuntimeKernelError;
}

export interface CreateRuntimeKernelInput {
  readonly metadata?: CreateRuntimeKernelMetadataInput;
}

export class RuntimeKernel {
  #state: RuntimeKernelState = "created";
  #metadata: RuntimeKernelMetadata;
  #initializedAt?: Date;
  #stoppedAt?: Date;
  #failedAt?: Date;
  #lastError?: RuntimeKernelError;

  constructor(input: CreateRuntimeKernelInput = {}) {
    this.#metadata = createRuntimeKernelMetadata(input.metadata);
  }

  get state(): RuntimeKernelState {
    return this.#state;
  }

  get metadata(): RuntimeKernelMetadata {
    return this.#metadata;
  }

  assignMetadata(input: Partial<CreateRuntimeKernelMetadataInput>): RuntimeKernelMetadata {
    this.#metadata = {
      ...this.#metadata,
      ...input,
      id: input.id ?? this.#metadata.id,
      name: input.name ?? this.#metadata.name,
      version: input.version ?? this.#metadata.version,
      createdAt: input.createdAt ?? this.#metadata.createdAt,
    };

    return this.#metadata;
  }

  initialize(now: Date = new Date()): RuntimeKernelHealth {
    this.#transition("initializing", "initialize");
    this.#initializedAt = now;
    this.#transition("running", "initialize");

    return this.getHealth();
  }

  shutdown(now: Date = new Date()): RuntimeKernelHealth {
    this.#transition("stopping", "shutdown");
    this.#stoppedAt = now;
    this.#transition("stopped", "shutdown");

    return this.getHealth();
  }

  fail(error: Error | string, now: Date = new Date()): RuntimeKernelHealth {
    if (this.#state === "stopped") {
      throw new RuntimeKernelError(
        "RUNTIME_KERNEL_ALREADY_TERMINAL",
        "Stopped runtime kernels cannot be failed.",
        { from: this.#state, to: "failed", operation: "fail" }
      );
    }

    this.#failedAt = now;
    this.#lastError =
      error instanceof RuntimeKernelError
        ? error
        : new RuntimeKernelError(
            "RUNTIME_KERNEL_INVALID_TRANSITION",
            typeof error === "string" ? error : error.message,
            { from: this.#state, to: "failed", operation: "fail" }
          );
    this.#state = "failed";

    return this.getHealth();
  }

  getHealth(): RuntimeKernelHealth {
    return {
      state: this.#state,
      healthy: this.#state === "running",
      metadata: this.#metadata,
      initializedAt: this.#initializedAt,
      stoppedAt: this.#stoppedAt,
      failedAt: this.#failedAt,
      lastError: this.#lastError,
    };
  }

  #transition(nextState: RuntimeKernelState, operation: string): void {
    if (isTerminalRuntimeKernelState(this.#state)) {
      throw new RuntimeKernelError(
        "RUNTIME_KERNEL_ALREADY_TERMINAL",
        `Runtime kernel cannot transition from ${this.#state} to ${nextState}.`,
        { from: this.#state, to: nextState, operation }
      );
    }

    if (!this.#canTransition(this.#state, nextState)) {
      throw new RuntimeKernelError(
        "RUNTIME_KERNEL_INVALID_TRANSITION",
        `Invalid runtime kernel transition from ${this.#state} to ${nextState}.`,
        { from: this.#state, to: nextState, operation }
      );
    }

    this.#state = nextState;
  }

  #canTransition(from: RuntimeKernelState, to: RuntimeKernelState): boolean {
    const transitions: Readonly<Record<RuntimeKernelState, readonly RuntimeKernelState[]>> = {
      created: ["initializing", "failed"],
      initializing: ["running", "failed"],
      running: ["stopping", "failed"],
      stopping: ["stopped", "failed"],
      stopped: [],
      failed: [],
    };

    return transitions[from].includes(to);
  }
}

export function createRuntimeKernel(input: CreateRuntimeKernelInput = {}): RuntimeKernel {
  return new RuntimeKernel(input);
}
