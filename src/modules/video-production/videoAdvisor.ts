export interface VideoAdvisorTip { id: string; priority: number; title: string; body: string; }

export function getVideoAdvisorTips(hasGenerated: boolean, qualityScore: number): VideoAdvisorTip[] {
  const tips: VideoAdvisorTip[] = [];
  if (!hasGenerated) { tips.push({ id: 'first_video', priority: 1, title: '生成第一支视频', body: '选择一个内容支柱，系统帮你从策略到字幕全部生成。' }); }
  if (qualityScore < 60 && hasGenerated) { tips.push({ id: 'improve_quality', priority: 2, title: '提升视频质量', body: '当前的视频质量分数偏低。检查 Hook 是否够吸引人、CTA 是否清晰。' }); }
  if (tips.length === 0) { tips.push({ id: 'all_good', priority: 99, title: '视频包就绪', body: '你的视频生产包已经准备好了，可以开始拍摄或使用 AI 工具生成。' }); }
  return tips.sort((a, b) => a.priority - b.priority);
}
