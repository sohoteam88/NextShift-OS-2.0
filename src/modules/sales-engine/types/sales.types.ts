export type ClosingStyle = 'soft' | 'consultative' | 'urgency' | 'commitment' | 'application';
export type OpportunityStage = 'new_opportunity' | 'proposal_sent' | 'proposal_viewed' | 'objection_raised' | 'closing' | 'won' | 'lost';

export interface ObjectionResponse {
  objection: string;
  rootCause: string;
  responseFramework: string;
  followUpQuestion: string;
}

export interface ProposalData {
  problem: string;
  solution: string;
  benefits: string[];
  proof: string;
  pricing: string;
  nextStep: string;
}

export interface SalesStats {
  proposalsSent: number;
  proposalsViewed: number;
  closing: number;
  won: number;
  lost: number;
  closeRate: number;
  revenue: number;
  revenuePerLead: number;
  averageOrderValue: number;
}

export interface SalesPlaybook {
  opening: string;
  discoveryQuestions: string[];
  valuePresentation: string;
  objections: string[];
  closingMethods: ClosingStyle[];
}
