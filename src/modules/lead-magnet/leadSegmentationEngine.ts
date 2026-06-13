import type { LeadSegment } from './types';

export interface SegmentResult { leadScore: LeadSegment; label: string; nextAction: string; followUpStrategy: string; priority: number; }

const SEGMENTS: Record<LeadSegment, Omit<SegmentResult, 'leadScore'>> = {
  A: { label: 'Hot Lead — 准备行动', nextAction: '立即发送WhatsApp + 预约策略咨询', followUpStrategy: '24小时内1对1跟进，发送完整方案', priority: 1 },
  B: { label: 'Interested — 有兴趣但需要信息', nextAction: '发送更多案例和证明', followUpStrategy: '3天内发3条有价值的内容 + 1次跟进', priority: 2 },
  C: { label: 'Exploring — 在探索阶段', nextAction: '发送免费内容和教育资料', followUpStrategy: '加入你的内容生态（关注+订阅），长期培养', priority: 3 },
  D: { label: 'Not Ready — 时机未到', nextAction: '保持轻触达，不要强推', followUpStrategy: '每个月发一条有价值的内容保持联系', priority: 4 },
};

export function classifyLead(totalScore: number, maxPossible: number): SegmentResult {
  const pct = maxPossible > 0 ? totalScore / maxPossible : 0;
  let segment: LeadSegment;
  if (pct >= 0.75) segment = 'A';
  else if (pct >= 0.5) segment = 'B';
  else if (pct >= 0.25) segment = 'C';
  else segment = 'D';
  return { leadScore: segment, ...SEGMENTS[segment] };
}
