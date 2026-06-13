import type { AgentExecutionInput, AgentExecutionReport } from '../types';

export async function executeSalesCoach(input: AgentExecutionInput): Promise<AgentExecutionReport> {
  const findings: string[] = ['已检查你的销售跟进状态。'];
  const recs: string[] = [];
  const acts: AgentExecutionReport['actions'] = [];
  const wa = await import('@/modules/whatsapp-ai/whatsappService').then(m => m.whatsappService.get(input.userId));
  if (!wa) { findings.push('WhatsApp AI助理未激活。'); recs.push('激活AI助理，生成回复模板和跟进计划。'); acts.push({ description: '激活WhatsApp AI', route: '/whatsapp-ai', module: 'WhatsApp AI' }); }
  else { findings.push(`WhatsApp AI已配置 (${wa.followupTemplates.length}个跟进模板)。`); if (wa.bestFollowups.length > 0) { findings.push(`有${wa.bestFollowups.length}个Best Followup机会。`); recs.push('优先跟进高评分Lead。'); } }
  return { agent: 'sales_coach', objective: input.objective, findings, recommendations: recs, actions: acts, confidenceScore: wa ? 80 : 20, executedAt: new Date().toISOString() };
}
