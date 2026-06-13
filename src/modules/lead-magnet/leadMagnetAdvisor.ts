export interface LMAdvisorTip { id: string; priority: number; title: string; body: string; }

export function getLMAdvisorTips(hasGenerated: boolean, qualityScore: number): LMAdvisorTip[] {
  const tips: LMAdvisorTip[] = [];
  if (!hasGenerated) { tips.push({ id: 'first_lm', priority: 1, title: '创建第一个引流磁铁', body: '选择一个类型（推荐从评估开始），系统帮你生成完整的问题、评分和结果页。' }); }
  if (qualityScore < 60 && hasGenerated) { tips.push({ id: 'improve', priority: 2, title: '提升引流磁铁质量', body: '当前的CTA还不够有力。想想用户做完评测后最想要什么？' }); }
  if (tips.length === 0) { tips.push({ id: 'ready', priority: 99, title: '引流磁铁就绪', body: '你的引流磁铁已经准备好了。下一步连接到漏斗和WhatsApp跟进。' }); }
  return tips.sort((a, b) => a.priority - b.priority);
}
