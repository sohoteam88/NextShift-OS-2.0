export interface LMAdvisorTip { id: string; priority: number; title: string; body: string; }

export function getLMAdvisorTips(hasGenerated: boolean, qualityScore: number): LMAdvisorTip[] {
  const tips: LMAdvisorTip[] = [];
  if (!hasGenerated) { tips.push({ id: 'first_lm', priority: 1, title: '创建第一个引流磁铁', body: '选择资源类型即可生成。系统会直接使用你的访谈、Brand DNA 和业务状态，不会重复问资料。' }); }
  if (qualityScore < 60 && hasGenerated) { tips.push({ id: 'improve', priority: 2, title: '提升引流磁铁质量', body: '当前资源还需要更清楚的承诺和下一步行动。建议先完善 Brand DNA。' }); }
  if (tips.length === 0) { tips.push({ id: 'ready', priority: 99, title: '引流磁铁就绪', body: '你的资源和领取页已经准备好。下一步发布 Landing Page。' }); }
  return tips.sort((a, b) => a.priority - b.priority);
}
