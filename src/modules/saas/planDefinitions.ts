import type { PlanDefinition, FeatureKey } from './types';

export const PLANS: Record<string, PlanDefinition> = {
  free: {
    id: 'free', name: 'Free', priceLabel: '免费', targetUser: '体验系统',
    features: ['mission_engine', 'brand_discovery'],
    limits: { aiCredits: 30, videosPerMonth: 2, funnels: 1, leads: 10, seats: 1, workspaces: 1 },
    recommendedFor: '想了解NextShift OS的个人用户',
  },
  starter: {
    id: 'starter', name: 'Starter', priceLabel: 'RM99/月', targetUser: '建立个人品牌',
    features: ['mission_engine','brand_discovery','brand_dna','social_setup','content_engine'],
    limits: { aiCredits: 300, videosPerMonth: 5, funnels: 3, leads: 50, seats: 1, workspaces: 1 },
    recommendedFor: '认真建立个人品牌的创业者',
  },
  pro: {
    id: 'pro', name: 'Pro', priceLabel: 'RM299/月', targetUser: '建立完整获客系统',
    features: ['mission_engine','brand_discovery','brand_dna','social_setup','content_engine','video_production','lead_magnet','webinar','funnel_builder','traffic_engine','whatsapp_ai','crm','analytics'],
    limits: { aiCredits: 2000, videosPerMonth: 20, funnels: 10, leads: 500, seats: 3, workspaces: 3 },
    recommendedFor: '想要完整获客成交系统的创业者',
  },
  agency: {
    id: 'agency', name: 'Agency', priceLabel: 'RM999/月', targetUser: '管理团队和客户',
    features: ['mission_engine','brand_discovery','brand_dna','social_setup','content_engine','video_production','lead_magnet','webinar','funnel_builder','traffic_engine','whatsapp_ai','crm','analytics','admin','agency_management'],
    limits: { aiCredits: 10000, videosPerMonth: 100, funnels: 50, leads: 5000, seats: 10, workspaces: 20 },
    recommendedFor: '代理商、团队、多客户管理',
  },
};

export const UPGRADE_PATHS: Record<string, string[]> = {
  free: ['starter'],
  starter: ['pro'],
  pro: ['agency'],
  agency: [],
};

export const AI_CREDIT_COSTS: Record<string, number> = {
  brand_discovery: 1, brand_dna: 5, content_generation: 3, video_package: 10,
  funnel_generation: 15, smart_reply: 1, analytics_report: 8, webinar_generation: 10,
  lead_magnet_generation: 5, traffic_campaign: 8, social_setup: 3,
};
