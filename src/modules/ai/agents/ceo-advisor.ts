import type { AgentExecutionInput, AgentExecutionReport } from '../types/agents';

export async function executeCEOAdvisor(input: AgentExecutionInput): Promise<AgentExecutionReport> {
  const f: string[] = []; const r: string[] = []; const a: AgentExecutionReport['actions'] = [];
  const ac = await import('@/modules/analytics/analyticsService').then(m => m.analyticsService.getAnalyticsCenter(input.userId, input.tenantId));

  f.push(`业务健康度: ${ac.health.overallScore}/100`);
  if (ac.health.overallScore < 50) { f.push('业务基础还需加强。'); r.push('优先完善品牌资料和内容系统。'); a.push({ description: '完善品牌基础', route: '/brand-builder/profile', module: '品牌资料' }); }
  else if (ac.health.overallScore < 80) { f.push('业务在增长中。'); r.push('重点优化漏斗转化和客户跟进。'); a.push({ description: '优化漏斗转化', route: '/funnel', module: '漏斗页面中心' }); }
  else { f.push('业务运转良好。'); r.push('可以开始扩大流量和团队规模。'); a.push({ description: '扩大流量测试', route: '/traffic-engine', module: '流量行动中心' }); }

  if (ac.insights.length > 0) { f.push(`💡 ${ac.insights[0].insight}`); r.push(ac.insights[0].action); }
  if (ac.actions.length > 0) { a.push({ description: ac.actions[0].action, route: '/analytics-center', module: '洞察中心' }); }

  return { agent: 'ceo_advisor', objective: input.objective, findings: f, recommendations: r, actions: a, confidenceScore: ac.health.overallScore, executedAt: new Date().toISOString() };
}
