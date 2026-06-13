export type TrafficGoal = 'lead_generation' | 'webinar_registration' | 'whatsapp_conversation' | 'consultation_booking' | 'content_growth';
export type TrafficPlatform = 'facebook' | 'instagram' | 'tiktok' | 'xhs';
export type BudgetTier = 'starter' | 'growth' | 'scale';
export type CampaignStatus = 'draft' | 'ready' | 'launched' | 'paused';

export interface TrafficGoalInfo { objective: string; recommendedFunnel: string; recommendedPlatform: TrafficPlatform; recommendedCta: string; expectedKpi: string; }
export interface FacebookCampaign { campaignName: string; objective: string; audience: string; adAngles: string[]; creativeDirection: string; headlines: string[]; primaryText: string; cta: string; funnelPath: string; trafficType: 'cold' | 'warm' | 'retargeting'; }
export interface InstagramCampaign { reelConcept: string; storyConcept: string; carouselConcept: string; headline: string; cta: string; audience: string; }
export interface TikTokCampaign { hook: string; openingScene: string; creatorAngle: string; caption: string; cta: string; retentionStrategy: string; }
export interface XhsCampaign { contentAngle: string; educationalAngle: string; keywordDirection: string; titles: string[]; ctaStrategy: string; }
export interface BudgetPlan { tier: BudgetTier; dailyBudget: string; monthlyBudget: string; expectedLeads: string; riskLevel: 'low'|'medium'|'high'; }
export interface Campaign { name: string; objective: TrafficGoal; platform: TrafficPlatform; audience: string; creative: string; offer: string; cta: string; funnelDestination: string; trackingNotes: string; status: CampaignStatus; budgetTier: BudgetTier; readinessScore: number; }
export interface TrafficReadiness { score: number; level: 'low'|'medium'|'high'; funnelReady: number; landingPageReady: number; thankYouReady: number; ctaReady: number; whatsappReady: number; leadMagnetReady: number; contentAssetsReady: number; trackingReady: number; missingItems: string[]; recommendations: string[]; }
export interface LaunchChecklistItem { id: string; label: string; checked: boolean; }
export interface TrafficPackage { goal: TrafficGoal; readiness: TrafficReadiness; facebook?: FacebookCampaign; instagram?: InstagramCampaign; tiktok?: TikTokCampaign; xhs?: XhsCampaign; budget: BudgetPlan; campaign: Campaign; checklist: LaunchChecklistItem[]; analyticsConfig: Record<string,string>; status: CampaignStatus; createdAt: string; }

export const TRAFFIC_GOALS: Record<TrafficGoal, TrafficGoalInfo> = {
  lead_generation: { objective: '获取潜在客户联系方式', recommendedFunnel: 'Lead Magnet Funnel', recommendedPlatform: 'facebook', recommendedCta: '获取免费评估', expectedKpi: 'Cost Per Lead (CPL)' },
  webinar_registration: { objective: '获取Webinar注册', recommendedFunnel: 'Webinar Funnel', recommendedPlatform: 'instagram', recommendedCta: '立即注册', expectedKpi: 'Cost Per Registration' },
  whatsapp_conversation: { objective: '开启WhatsApp对话', recommendedFunnel: 'WhatsApp Funnel', recommendedPlatform: 'instagram', recommendedCta: 'WhatsApp 咨询', expectedKpi: 'Cost Per Conversation' },
  consultation_booking: { objective: '预约策略咨询', recommendedFunnel: 'Consultation Funnel', recommendedPlatform: 'facebook', recommendedCta: '预约咨询', expectedKpi: 'Cost Per Booking' },
  content_growth: { objective: '增加内容曝光和关注', recommendedFunnel: 'Content Funnel', recommendedPlatform: 'tiktok', recommendedCta: '关注获取更多', expectedKpi: 'Cost Per Follower' },
};
