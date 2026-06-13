export type PipelineStage = 'new_lead' | 'qualified' | 'appointment_scheduled' | 'appointment_completed' | 'offer_presented' | 'negotiation' | 'customer' | 'inactive' | 'lost';
export type OppStage = 'identified' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
export type LeadSource = 'assessment' | 'quiz' | 'checklist' | 'webinar' | 'funnel' | 'whatsapp' | 'organic' | 'referral' | 'manual';

export interface HotLead { leadId: string; name: string; score: number; reason: string; urgency: 'high'|'medium'; suggestedAction: string; }
export interface RevenueForecast { expectedRevenue: number; conservativeRevenue: number; optimisticRevenue: number; confidenceScore: number; pipelineValue: number; weightedValue: number; }
export interface Opportunity { id: string; title: string; leadId: string; leadName: string; value: number; probability: number; expectedCloseDate: string; stage: OppStage; notes: string; }
export interface CRMAdvisorTip { id: string; priority: number; tip: string; action: string; }
export interface CRMCommandCenter {
  leads: { total: number; new: number; qualified: number; byStage: Record<string, number>; bySource: Record<string, number> };
  hotLeads: HotLead[];
  opportunities: Opportunity[];
  revenueForecast: RevenueForecast;
  advisorTips: CRMAdvisorTip[];
  followups: { today: number; overdue: number; upcoming: number };
  appointments: { today: number; thisWeek: number; thisMonth: number };
}

export const PIPELINE_STAGES: PipelineStage[] = ['new_lead','qualified','appointment_scheduled','appointment_completed','offer_presented','negotiation','customer','inactive','lost'];
export const STAGE_LABELS: Record<PipelineStage, string> = { new_lead:'新Lead', qualified:'已认证', appointment_scheduled:'已预约', appointment_completed:'已完成通话', offer_presented:'已提案', negotiation:'谈判中', customer:'客户', inactive:'不活跃', lost:'已流失' };
export const STAGE_PROBABILITIES: Record<PipelineStage, number> = { new_lead:0.05, qualified:0.15, appointment_scheduled:0.25, appointment_completed:0.40, offer_presented:0.55, negotiation:0.70, customer:1.0, inactive:0.02, lost:0 };
