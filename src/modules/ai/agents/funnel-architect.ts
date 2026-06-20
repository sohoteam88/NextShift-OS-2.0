import type { AgentExecutionInput, AgentExecutionReport } from '../types/agents';

export async function executeFunnelArchitect(input: AgentExecutionInput): Promise<AgentExecutionReport> {
  const findings: string[] = ['已检查你的漏斗状态。'];
  const recs: string[] = [];
  const acts: AgentExecutionReport['actions'] = [];
  const lm = await import('@/modules/lead-magnet/leadMagnetService').then(m => m.leadMagnetService.get(input.userId));
  const fb = await import('@/modules/funnel/services/funnel-builder-service').then(m => m.funnelBuilderService.get(input.userId));
  if (!lm) { findings.push('还没有引流资源。'); recs.push('先创建一个评估、清单或指南，让潜在客户愿意留下联系方式。'); acts.push({ description: '创建引流资源', route: '/lead-magnet', module: '引流资源中心' }); }
  if (!fb) { findings.push('还没有完整漏斗页面。'); recs.push('创建完整的转化漏斗，把引流资源、领取页和跟进流程串起来。'); acts.push({ description: '创建漏斗页面', route: '/funnel', module: '漏斗页面中心' }); }
  if (lm && fb) { findings.push('漏斗基础已完成。'); recs.push('优化领取页 CTA 和跟进序列。'); acts.push({ description: '优化漏斗转化', route: '/funnel', module: '漏斗页面中心' }); }
  return { agent: 'funnel_architect', objective: input.objective, findings, recommendations: recs, actions: acts, confidenceScore: fb ? fb.healthScore : lm ? 50 : 15, executedAt: new Date().toISOString() };
}
