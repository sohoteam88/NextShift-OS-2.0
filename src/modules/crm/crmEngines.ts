// CRM Engines — revenue forecast, hot leads, advisor
import type { HotLead, RevenueForecast, CRMAdvisorTip, PipelineStage } from './types';
import { STAGE_PROBABILITIES, STAGE_LABELS } from './types';

export function forecastRevenue(leads: Array<{ pipelineStage: string; score: number }>, opportunities: Array<{ value: number; probability: number }>): RevenueForecast {
  const pipelineValue = opportunities.reduce((s, o) => s + o.value, 0);
  const weightedValue = opportunities.reduce((s, o) => s + o.value * (o.probability / 100), 0);
  const leadWeight = leads.reduce((s, l) => s + l.score * (STAGE_PROBABILITIES[l.pipelineStage as PipelineStage] ?? 0.05) * 100, 0);
  const totalWeighted = weightedValue + leadWeight;
  return {
    expectedRevenue: Math.round(totalWeighted),
    conservativeRevenue: Math.round(totalWeighted * 0.7),
    optimisticRevenue: Math.round(totalWeighted * 1.5),
    confidenceScore: leads.length > 0 ? Math.round(Math.min(100, (weightedValue / Math.max(pipelineValue, 1)) * 80 + 20)) : 0,
    pipelineValue, weightedValue: Math.round(totalWeighted),
  };
}

export function detectHotLeads(leads: Array<{ id: string; name: string; score: number; pipelineStage: string; updatedAt: string }>): HotLead[] {
  return leads
    .filter(l => l.score >= 70 || ['offer_presented','negotiation','appointment_scheduled'].includes(l.pipelineStage))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(l => ({
      leadId: l.id, name: l.name, score: l.score,
      reason: l.pipelineStage === 'offer_presented' ? '已提案，需跟进' : l.pipelineStage === 'appointment_scheduled' ? '已预约，即将通话' : l.score >= 80 ? '高评分Lead' : '活跃度高',
      urgency: (l.score >= 80 || l.pipelineStage === 'offer_presented') ? 'high' : 'medium',
      suggestedAction: l.pipelineStage === 'offer_presented' ? '发送跟进消息确认决策' : l.pipelineStage === 'appointment_scheduled' ? '准备通话内容' : l.score >= 80 ? '立即联系预约' : '发送教育内容培养',
    }));
}

export function getCRMAdvisor(leadCount: number, hotCount: number, overdueFollowups: number, pipelineStuck: number): CRMAdvisorTip[] {
  const tips: CRMAdvisorTip[] = [];
  if (hotCount > 0) tips.push({ id: 'hot', priority: 1, tip: `你有${hotCount}个Hot Lead需要立即关注`, action: '查看Hot Lead列表并联系' });
  if (overdueFollowups > 0) tips.push({ id: 'followup_overdue', priority: 2, tip: `${overdueFollowups}个跟进已逾期`, action: '今天完成逾期跟进' });
  if (pipelineStuck > 3) tips.push({ id: 'pipeline_stuck', priority: 3, tip: `${pipelineStuck}个Lead在管道中停滞超过7天`, action: '推动或关闭这些机会' });
  if (leadCount === 0) tips.push({ id: 'no_leads', priority: 1, tip: '还没有任何Lead。确保漏斗和流量在运转。', action: '检查Funnel和Traffic Engine' });
  if (tips.length === 0) tips.push({ id: 'all_good', priority: 99, tip: 'CRM运转正常，继续保持。', action: '检查Revenue Forecast' });
  return tips.sort((a, b) => a.priority - b.priority);
}
