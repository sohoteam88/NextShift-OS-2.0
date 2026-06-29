import type { Result } from "@nextshift/shared";
import type { Capability, CapabilityInput } from "../capability";
import type { CapabilityRuntimeContext } from "../context";
import type { CapabilityResult } from "../results";

export interface CapabilityRuntime {
  runCapability(
    capability: Capability,
    input: CapabilityInput,
    context: CapabilityRuntimeContext
  ): Promise<Result<CapabilityResult>>;
}
