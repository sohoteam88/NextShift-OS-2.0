// Content Director Agent — thin orchestration over Content Engine
import type { AgentExecutionInput, AgentExecutionReport } from '../types/agents';

export async function executeContentDirector(input: AgentExecutionInput): Promise<AgentExecutionReport> {
  const findings: string[] = [];
  const recommendations: string[] = [];
  const actions: AgentExecutionReport['actions'] = [];

  findings.push('已分析你的内容产出情况。');
  const ctx = await import('@/modules/brand-dna/services/BrandContextProvider').then(m => m.getBrandContext(input.userId));
  const { contentEngineService } = await import('@/modules/content-engine/contentEngineService');

  const pillars = await contentEngineService.getPillars(input.userId);
  const publishedCount = await contentEngineService.getPublishedCount(input.userId);

  if (pillars.length === 0) { findings.push('尚未建立内容支柱。'); recommendations.push('先生成3-5个内容支柱作为创作骨架。'); actions.push({ description: '生成内容支柱', route: '/content-engine', module: 'Content Engine' }); }
  if (publishedCount === 0) { findings.push('还没有发布任何内容。'); recommendations.push('先发布第一篇简单介绍贴，不要等完美。'); actions.push({ description: '发布第一篇内容', route: '/content-engine', module: 'Content Engine' }); }
  if (publishedCount > 0 && publishedCount < 5) { findings.push('内容产出较低。'); recommendations.push('保持每周至少3篇内容的节奏。'); actions.push({ description: '生成30天内容日历', route: '/content-engine', module: 'Content Engine' }); }
  if (pillars.length >= 3 && publishedCount >= 5) { findings.push('内容引擎运转良好。'); recommendations.push('可以开始视频内容了。'); actions.push({ description: '开始视频引擎', route: '/video-production', module: 'Video Production' }); }

  return { agent: 'content_director', objective: input.objective, findings, recommendations, actions, confidenceScore: pillars.length > 0 ? 80 : 30, executedAt: new Date().toISOString() };
}
