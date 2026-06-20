import type { AgentExecutionInput, AgentExecutionReport } from '../types/agents';

export async function executeSalesCoach(input: AgentExecutionInput): Promise<AgentExecutionReport> {
  const findings: string[] = ['已检查你的销售跟进状态。'];
  const recs: string[] = [];
  const acts: AgentExecutionReport['actions'] = [];
  const wa = await import('@/modules/whatsapp-ai/whatsappService').then(m => m.whatsappService.get(input.userId));
  if (!wa) { findings.push('客户跟进系统尚未激活。'); recs.push('先准备回复模板和跟进计划，等有潜在客户后可以直接执行。'); acts.push({ description: '准备客户跟进', route: '/whatsapp-ai', module: '客户跟进中心' }); }
  else { findings.push(`客户跟进已配置 (${wa.followupTemplates.length}个跟进模板)。`); if (wa.bestFollowups.length > 0) { findings.push(`有${wa.bestFollowups.length}个优先跟进机会。`); recs.push('优先跟进高意向潜在客户。'); } }
  return { agent: 'sales_coach', objective: input.objective, findings, recommendations: recs, actions: acts, confidenceScore: wa ? 80 : 20, executedAt: new Date().toISOString() };
}
