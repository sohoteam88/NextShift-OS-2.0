// Brand Strategist Agent — thin orchestration over Brand Discovery + Brand DNA
import type { AgentExecutionInput, AgentExecutionReport } from '../types/agents';

export async function executeBrandStrategist(input: AgentExecutionInput): Promise<AgentExecutionReport> {
  // Delegates to existing services — no duplicated logic
  const findings: string[] = [];
  const recommendations: string[] = [];
  const actions: AgentExecutionReport['actions'] = [];

  findings.push('已读取你的品牌DNA数据。');

  // Check brand completeness
  const bp = await import('@/modules/brand-dna/services/brandDnaService').then(m => m.brandDnaService.getBrandDNA(input.userId));
  const health = await import('@/modules/brand-dna/services/brandDnaValidator').then(m => m.validateBrandDNA(bp));

  if (health.identityClarity < 70) { findings.push('品牌身份还不够清晰。'); recommendations.push('完善品牌名称和定位陈述。'); actions.push({ description: '完善品牌身份', route: '/brand-builder/profile', module: '品牌资料' }); }
  if (health.audienceClarity < 70) { findings.push('目标受众需要更明确的定义。'); recommendations.push('定义目标受众的痛点和目标。'); actions.push({ description: '定义目标受众', route: '/brand-builder/profile', module: '品牌资料' }); }
  if (health.offerClarity < 70) { findings.push('服务产品的方向还需要更清晰。'); recommendations.push('明确你的主要服务和转变承诺。'); actions.push({ description: '明确服务产品', route: '/brand-builder/profile', module: '品牌资料' }); }
  if (actions.length === 0) { findings.push('品牌基础扎实，各维度表现良好。'); recommendations.push('可以进入内容策略阶段。'); actions.push({ description: '开始内容策略', route: '/content-engine', module: '内容引擎' }); }

  return { agent: 'brand_strategist', objective: input.objective, findings, recommendations, actions, confidenceScore: health.overallScore, executedAt: new Date().toISOString() };
}
