import type { LeadScore } from './types';

export function getWhatsappAdvisor(leads: Array<{ score: number }>): string[] {
  const tips: string[] = [];
  const hot = leads.filter(l => l.score >= 80).length;
  const warm = leads.filter(l => l.score >= 50 && l.score < 80).length;
  if (hot > 0) tips.push(`你有${hot}个Hot Lead，应该立即预约通话或发送完整方案。`);
  if (warm > 0) tips.push(`${warm}个Warm Lead需要教育内容跟进，48小时内触达。`);
  if (leads.some(l => l.score < 25)) tips.push('有Cold Lead需要长期培养，不要施压。');
  if (tips.length === 0) tips.push('暂无活跃Lead。先确保漏斗和流量在运转。');
  return tips;
}
