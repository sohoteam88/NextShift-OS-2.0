export interface CapabilityDescriptor {
  readonly capabilityId: string;
  readonly name: string;
  readonly description?: string;
}

export interface CapabilityRegistryPort {
  listCapabilities(): Promise<readonly CapabilityDescriptor[]>;
  getCapability(capabilityId: string): Promise<CapabilityDescriptor | null>;
}
