// Revenue Journey Service — 30-day first revenue challenge

export interface RevenueMilestone {
  day: number;
  title: string;
  route: string;
  reward: string;
  score: number;
  revenueTarget?: number;
}

const REVENUE_MILESTONES: RevenueMilestone[] = [
  { day: 8, title: '发送第一份提案', route: '/sales', reward: 'Proposal Creator 徽章', score: 10 },
  { day: 10, title: '完成第一次销售对话', route: '/sales', reward: 'Sales Starter 徽章', score: 20 },
  { day: 15, title: '成交第一位客户', route: '/customers', reward: 'Customer Closer 徽章', score: 30 },
  { day: 20, title: '创造第一笔 RM100 收入', route: '/sales', reward: 'Revenue Generator 徽章', score: 40, revenueTarget: 100 },
  { day: 30, title: '创造第一笔 RM1000 收入', route: '/sales', reward: 'First Revenue 里程碑', score: 60, revenueTarget: 1000 },
];

const SCORES = REVENUE_MILESTONES.reduce((acc, m) => { acc[m.title] = m.score; return acc; }, {} as Record<string, number>);

export function getRevenueScore(completedEvents: string[]): number {
  return completedEvents.reduce((sum, e) => sum + (SCORES[e] ?? 0), 0);
}

export function getRevenueLevel(score: number): 'learning' | 'selling' | 'revenue_active' | 'revenue_builder' {
  if (score >= 100) return 'revenue_builder';
  if (score >= 70) return 'revenue_active';
  if (score >= 40) return 'selling';
  return 'learning';
}

export function getNextRevenueMilestone(completedEvents: string[]): RevenueMilestone | null {
  return REVENUE_MILESTONES.find(m => !completedEvents.includes(m.title)) ?? null;
}

export function isRevenueJourneyComplete(completedEvents: string[]): boolean {
  return REVENUE_MILESTONES.every(m => completedEvents.includes(m.title));
}

export function forecastRevenue(currentRevenue: number, closeRate: number, leadCount: number): number {
  return Math.round(currentRevenue + ((closeRate / 100) * leadCount * 100));
}

export { REVENUE_MILESTONES };
