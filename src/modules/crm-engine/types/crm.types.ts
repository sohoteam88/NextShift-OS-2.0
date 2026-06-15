export type PipelineStage = 'new' | 'contacted' | 'qualified' | 'appointment' | 'proposal' | 'customer' | 'lost';
export type FollowUpStatus = 'pending' | 'completed' | 'overdue';
export type OpportunityLevel = 'hot' | 'warm' | 'cold';

export interface PipelineStats {
  new: number; contacted: number; qualified: number;
  appointment: number; proposal: number; customer: number; lost: number;
  totalValue: number; conversionRate: number;
}

export interface FollowUpItem {
  id: string; leadId: string; leadName: string; dueDate: string;
  status: FollowUpStatus; description: string;
}

export interface CRMStats {
  pipeline: PipelineStats;
  dueFollowUps: number;
  overdueFollowUps: number;
  hotOpportunities: number;
  activeCustomers: number;
  monthlyRevenue: number;
}
