import type { AgentExecutionInput, AgentExecutionReport } from '../types/agents';

export async function executeFunnelArchitect(input: AgentExecutionInput): Promise<AgentExecutionReport> {
  const findings: string[] = ['已检查你的漏斗状态。'];
  const recs: string[] = [];
  const acts: AgentExecutionReport['actions'] = [];
  const lm = await import('@/modules/lead-magnet/leadMagnetService').then(m => m.leadMagnetService.get(input.userId));
  const fb = await import('@/modules/funnel-builder/funnelBuilderService').then(m => m.funnelBuilderService.get(input.userId));
  if (!lm) { findings.push('还没有引流磁铁。'); recs.push('先创建一个评估或清单作为引流磁铁。'); acts.push({ description: '创建引流磁铁', route: '/lead-magnet', module: 'Lead Magnet Builder' }); }
  if (!fb) { findings.push('还没有漏斗。'); recs.push('创建完整的转化漏斗，把引流磁铁和Webinar串起来。'); acts.push({ description: '创建漏斗', route: '/funnel-builder', module: 'Funnel Builder' }); }
  if (lm && fb) { findings.push('漏斗基础已完成。'); recs.push('优化着陆页CTA和跟进序列。'); acts.push({ description: '优化漏斗转化', route: '/funnel-builder', module: 'Funnel Builder' }); }
  return { agent: 'funnel_architect', objective: input.objective, findings, recommendations: recs, actions: acts, confidenceScore: fb ? fb.healthScore : lm ? 50 : 15, executedAt: new Date().toISOString() };
}
