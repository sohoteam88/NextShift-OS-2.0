import type { CapabilityDefinition } from "@nextshift/domain";
import type { Result } from "@nextshift/shared";
import type { CapabilityRuntimeContext } from "../context";
import type { CapabilityResult } from "../results";

export interface CapabilityInput {
  readonly capabilityId: string;
  readonly payload?: unknown;
}

export interface Capability {
  readonly definition: CapabilityDefinition;

  execute(
    input: CapabilityInput,
    context: CapabilityRuntimeContext
  ): Promise<Result<CapabilityResult>>;
}
