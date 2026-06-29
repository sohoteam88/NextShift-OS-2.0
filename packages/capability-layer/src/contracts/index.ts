export interface CapabilityContract {
  readonly purpose: string;
  readonly requiredInputs: readonly string[];
  readonly producedOutputs: readonly string[];
  readonly riskLevel: "low" | "medium" | "high";
  readonly measurementMethod?: string;
}
