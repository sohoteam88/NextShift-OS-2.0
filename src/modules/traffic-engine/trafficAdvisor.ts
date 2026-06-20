import type { TrafficReadiness } from './types';

export function getTrafficAdvisorTips(readiness: TrafficReadiness): string[] {
  const tips: string[] = [];
  if (readiness.score < 50) tips.push('先完成漏斗页面和引流资源。没有完整承接页，流量来了也很难留下客户。');
  if (readiness.contentAssetsReady < 50) tips.push('建议先准备 3-5 条可发布内容，再用小预算测试。');
  if (readiness.trackingReady < 50) tips.push('确保 UTM 追踪和像素设置正确，否则无法衡量效果。');
  if (readiness.score >= 80) tips.push('基础承接已经就绪，可以先跑 3 天小预算测试，再根据数据优化。');
  if (tips.length === 0) tips.push('继续完善漏斗和内容资产，准备好了再启动广告。');
  return tips;
}
