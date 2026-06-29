import type { Capability } from "../capability";

export interface CapabilityRegistry {
  register(capability: Capability): void;
  list(): readonly Capability[];
  get(capabilityId: string): Capability | null;
}
