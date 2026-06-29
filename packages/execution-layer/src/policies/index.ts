export interface AutomationPolicy {
  readonly policyId: string;
  readonly name: string;
  readonly enabled: boolean;
  readonly riskLevel: "low" | "medium" | "high";
}

export interface AutomationPolicyPort {
  getPolicy(policyId: string): Promise<AutomationPolicy | null>;
}
