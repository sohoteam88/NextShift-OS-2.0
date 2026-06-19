import type { BusinessMemoryEvent } from '../contracts/BusinessContextMemory';

const CHECK_LABELS: Record<string, string> = {
  brand_interview_completed: '完成品牌访谈',
  brand_dna_completed: '完成品牌 DNA',
  first_content_generated: '发布第一篇内容',
  lead_magnet_created: '创建第一个引流磁铁',
  funnel_published: '发布漏斗页面',
  first_lead_captured: '获得第一位潜在客户',
  first_customer_closed: '完成第一次成交',
};

function normalizeLabel(value: string) {
  return CHECK_LABELS[value] ?? value.replace(/_/g, ' ');
}

export function deriveCompletedMilestones(input: {
  completedChecks?: string[];
  achievementTitles?: string[];
  events?: BusinessMemoryEvent[];
}): string[] {
  const labels = new Set<string>();

  for (const check of input.completedChecks ?? []) {
    if (check) labels.add(normalizeLabel(check));
  }

  for (const title of input.achievementTitles ?? []) {
    if (title) labels.add(title);
  }

  for (const event of input.events ?? []) {
    if (event.type === 'MISSION_COMPLETED' && event.title) labels.add(event.title);
  }

  return Array.from(labels).slice(0, 8);
}
