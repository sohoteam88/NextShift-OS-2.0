import type { AgentExecutionInput, AgentExecutionReport } from '../types/agents';

export async function executeCEOAdvisor(input: AgentExecutionInput): Promise<AgentExecutionReport> {
  const f: string[] = []; const r: string[] = []; const a: AgentExecutionReport['actions'] = [];
  const ac = await import('@/modules/analytics/analyticsService').then(m => m.analyticsService.getAnalyticsCenter(input.userId, input.tenantId));

  f.push(`业务健康度: ${ac.health.overallScore}/100`);
  if (ac.health.overallScore < 50) { f.push('业务基础还需加强。'); r.push('优先完成Brand DNA和Content Engine。'); a.push({ description: '完善品牌基础', route: '/brand-builder/profile', module: 'Brand DNA' }); }
  else if (ac.health.overallScore < 80) { f.push('业务在增长中。'); r.push('重点优化漏斗转化和跟进系统。'); a.push({ description: '优化漏斗转化', route: '/funnel', module: 'Funnel Builder' }); }
  else { f.push('业务运转良好。'); r.push('可以开始扩大规模和团队。'); a.push({ description: '扩大规模', route: '/traffic-engine', module: 'Traffic Engine' }); }

  if (ac.insights.length > 0) { f.push(`💡 ${ac.insights[0].insight}`); r.push(ac.insights[0].action); }
  if (ac.nextActions.length > 0) { a.push({ description: ac.nextActions[0].action, route: '/analytics-center', module: 'Analytics' }); }

  return { agent: 'ceo_advisor', objective: input.objective, findings: f, recommendations: r, actions: a, confidenceScore: ac.health.overallScore, executedAt: new Date().toISOString() };
}
