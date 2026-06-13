import type { TrafficReadiness } from './types';

export function getTrafficAdvisorTips(readiness: TrafficReadiness): string[] {
  const tips: string[] = [];
  if (readiness.score < 50) tips.push('先完成 Funnel Builder 和 Lead Magnet Builder。没有完整漏斗，投广告等于烧钱。');
  if (readiness.contentAssetsReady < 50) tips.push('建议从 Starter Budget 开始测试（RM20-50/天），先用小预算验证。');
  if (readiness.trackingReady < 50) tips.push('确保 UTM 追踪和像素设置正确，否则无法衡量效果。');
  if (readiness.score >= 80) tips.push('漏斗已就绪，可以从小预算开始测试。先跑3天，分析数据再优化。');
  if (tips.length === 0) tips.push('继续完善漏斗和内容资产，准备好了再启动广告。');
  return tips;
}
