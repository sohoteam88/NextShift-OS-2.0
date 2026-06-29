export interface OptimizationOpportunity {
  readonly opportunityId: string;
  readonly title: string;
  readonly rationale?: string;
}

export interface OptimizationEnginePort {
  identifyOpportunities(input: unknown): Promise<readonly OptimizationOpportunity[]>;
}
