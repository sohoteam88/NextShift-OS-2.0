// Video Producer Agent — thin orchestration over Video Production Engine
import type { AgentExecutionInput, AgentExecutionReport } from '../types/agents';

export async function executeVideoProducer(input: AgentExecutionInput): Promise<AgentExecutionReport> {
  const findings: string[] = ['已检查你的视频生产状态。'];
  const recs: string[] = [];
  const acts: AgentExecutionReport['actions'] = [];

  const { videoProjectService } = await import('@/modules/video/services/video-project-service');
  const projects = await videoProjectService.list({ id: input.userId, tenantId: input.tenantId });
  const vp = projects[0] ?? null;

  if (!vp) { findings.push('还没有生成任何视频项目。'); recs.push('选择一个内容支柱，生成第一支视频。'); acts.push({ description: '生成第一支视频', route: '/video?view=production', module: 'Video Production' }); }
  else { findings.push(`已有视频项目 (状态: ${vp.status})`); recs.push('继续生成更多视频内容，扩展你的视频库。'); acts.push({ description: '生成更多视频', route: '/video?view=production', module: 'Video Production' }); }

  return { agent: 'video_producer', objective: input.objective, findings, recommendations: recs, actions: acts, confidenceScore: vp ? 75 : 10, executedAt: new Date().toISOString() };
}
