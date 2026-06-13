export type LeadScore = 'A' | 'B' | 'C' | 'D';
export type LeadStage = 'new' | 'contacted' | 'qualified' | 'appointment' | 'negotiation' | 'won' | 'lost';
export type ObjectionType = 'no_time' | 'no_money' | 'need_think' | 'spouse' | 'afraid' | 'not_suitable' | 'too_expensive' | 'not_now';
export type AppointmentType = 'consultation' | 'strategy_call' | 'product_demo';

export interface SmartReply { text: string; style: 'soft' | 'value_first' | 'direct'; reason: string; }
export interface LeadQualification { qualificationScore: number; goals: string; painPoints: string; urgency: 'high'|'medium'|'low'; budgetReadiness: boolean; decisionReadiness: boolean; summary: string; nextAction: string; }
export interface LeadScoring { score: LeadScore; reason: string; recommendation: string; }
export interface ObjectionResponse { empathyResponse: string; clarificationQuestion: string; valueResponse: string; cta: string; }
export interface FollowupPlan { id: string; day: number; label: string; message: string; status: 'pending'|'sent'; }
export interface AppointmentFlow { bookingInvitation: string; reminder24h: string; reminder1h: string; confirmation: string; reschedule: string; }
export interface BestFollowup { leadId: string; leadName: string; score: LeadScore; reason: string; suggestedMessage: string; }
export interface WhatsAppPackage { smartReplies: Record<string, SmartReply[]>; qualifications: Record<string, LeadQualification>; scoring: Record<string, LeadScoring>; objections: Record<ObjectionType, ObjectionResponse>; followupTemplates: FollowupPlan[]; appointment: AppointmentFlow; bestFollowups: BestFollowup[]; voiceConfig: { provider: string; enabled: boolean }; }
