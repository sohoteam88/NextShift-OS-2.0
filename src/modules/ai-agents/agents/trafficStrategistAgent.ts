import type { AgentExecutionInput, AgentExecutionReport } from '../types';

export async function executeTrafficStrategist(input: AgentExecutionInput): Promise<AgentExecutionReport> {
  const f: string[] = ['已检查你的流量准备状态。']; const r: string[] = []; const a: AgentExecutionReport['actions'] = [];
  const te = await import('@/modules/traffic-engine/trafficEngineService').then(m => m.trafficEngineService.get(input.userId));
  if (!te) { f.push('还没有生成流量策略。'); r.push('先完成漏斗后再规划流量。'); a.push({ description: '生成流量策略', route: '/traffic-engine', module: 'Traffic Engine' }); }
  else if (te.readiness.level === 'low') { f.push('流量准备度偏低。'); r.push('先完善漏斗和内容资产。'); a.push({ description: '提升流量准备度', route: '/traffic-engine', module: 'Traffic Engine' }); }
  else { f.push('流量策略就绪。'); r.push('从Starter Budget开始测试。'); a.push({ description: '启动流量测试', route: '/traffic-engine', module: 'Traffic Engine' }); }
  return { agent: 'traffic_strategist', objective: input.objective, findings: f, recommendations: r, actions: a, confidenceScore: te ? te.readiness.score : 10, executedAt: new Date().toISOString() };
}
