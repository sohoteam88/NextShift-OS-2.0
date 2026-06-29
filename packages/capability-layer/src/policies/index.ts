export interface CapabilityPolicy {
  readonly policyId: string;
  readonly name: string;
  readonly allowAutonomousExecution: false;
  readonly requiresDecisionApproval: true;
}
