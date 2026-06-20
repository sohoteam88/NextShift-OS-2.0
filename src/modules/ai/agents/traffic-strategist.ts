import type { AgentExecutionInput, AgentExecutionReport } from '../types/agents';

export async function executeTrafficStrategist(input: AgentExecutionInput): Promise<AgentExecutionReport> {
  const f: string[] = ['已检查你的流量准备状态。']; const r: string[] = []; const a: AgentExecutionReport['actions'] = [];
  const te = await import('@/modules/traffic-engine/trafficEngineService').then(m => m.trafficEngineService.get(input.userId));
  if (!te) { f.push('还没有生成流量策略。'); r.push('先完成漏斗页面，再规划流量测试。'); a.push({ description: '生成流量策略', route: '/traffic-engine', module: '流量行动中心' }); }
  else if (te.readiness.level === 'low') { f.push('流量承接还不够完整。'); r.push('先完善漏斗页面、引流资源和内容素材。'); a.push({ description: '补齐流量承接', route: '/traffic-engine', module: '流量行动中心' }); }
  else { f.push('流量策略已准备好。'); r.push('先用测试预算跑小范围验证，再根据数据优化。'); a.push({ description: '启动流量测试', route: '/traffic-engine', module: '流量行动中心' }); }
  return { agent: 'traffic_strategist', objective: input.objective, findings: f, recommendations: r, actions: a, confidenceScore: te ? te.readiness.score : 10, executedAt: new Date().toISOString() };
}
