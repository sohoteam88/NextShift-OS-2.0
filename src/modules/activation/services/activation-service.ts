// Activation Service — 7-day new user activation program

import { CANONICAL_ROUTES } from '@/config/canonical-routes';

export interface DayMission {
  day: number;
  title: string;
  description: string;
  route: string;
  successEvent: string;
  reward: string;
  estimatedMinutes: number;
}

const DAY_MISSIONS: DayMission[] = [
  { day: 1, title: '完成品牌访谈', description: '让 AI 了解你的故事、背景和目标。', route: CANONICAL_ROUTES.brandInterview, successEvent: 'brand_discovery_completed', reward: '+100 XP', estimatedMinutes: 15 },
  { day: 2, title: '完成品牌 DNA', description: '生成你完整的品牌身份和定位。', route: CANONICAL_ROUTES.brandProfile, successEvent: 'brand_dna_confirmed', reward: 'Brand Architect 徽章', estimatedMinutes: 10 },
  { day: 3, title: '发布第一篇内容', description: '根据品牌 DNA 发布第一篇文章。', route: CANONICAL_ROUTES.contentEngine, successEvent: 'first_content_generated', reward: 'Content Creator 徽章', estimatedMinutes: 20 },
  { day: 4, title: '创建第一个引流磁铁', description: '制作免费资源吸引潜在客户。', route: CANONICAL_ROUTES.leadMagnet, successEvent: 'lead_magnet_created', reward: 'Lead Builder 徽章', estimatedMinutes: 20 },
  { day: 5, title: '启动流量获取潜在客户', description: '分享你的引流磁铁获取第一个名单。', route: CANONICAL_ROUTES.trafficEngine, successEvent: 'campaign_launched', reward: '+200 XP', estimatedMinutes: 15 },
  { day: 6, title: '发送第一次跟进', description: '用 AI 自动跟进你的潜在客户。', route: CANONICAL_ROUTES.crm, successEvent: 'whatsapp_ai_configured', reward: 'CRM Starter 徽章', estimatedMinutes: 10 },
  { day: 7, title: '完成第一次预约', description: '安排一次客户咨询或策略电话。', route: CANONICAL_ROUTES.crm, successEvent: 'first_sale_completed', reward: 'First Win 成就', estimatedMinutes: 15 },
];

const TOTAL_DAYS = 7;

export function getActivationDay(completedEvents: string[]): number {
  // Day 1 = 0 completed, Day 2 = 1 completed, etc.
  const nextIncomplete = DAY_MISSIONS.find(m => !completedEvents.includes(m.successEvent));
  return nextIncomplete?.day ?? TOTAL_DAYS;
}

export function getCurrentDayMission(completedEvents: string[]): DayMission | null {
  return DAY_MISSIONS.find(m => !completedEvents.includes(m.successEvent)) ?? null;
}

export function isActivationComplete(completedEvents: string[]): boolean {
  return DAY_MISSIONS.every(m => completedEvents.includes(m.successEvent));
}

export function getActivationScore(completedEvents: string[]): number {
  const scores: Record<string, number> = {
    brand_discovery_completed: 10, brand_dna_confirmed: 15,
    first_content_generated: 20, lead_magnet_created: 20,
    campaign_launched: 25, whatsapp_ai_configured: 30,
    first_sale_completed: 40,
  };
  return completedEvents.reduce((sum, event) => sum + (scores[event] ?? 0), 0);
}

export function getActivationLevel(score: number): 'at_risk' | 'engaged' | 'activated' {
  if (score >= 70) return 'activated';
  if (score >= 40) return 'engaged';
  return 'at_risk';
}

export { DAY_MISSIONS, TOTAL_DAYS };
