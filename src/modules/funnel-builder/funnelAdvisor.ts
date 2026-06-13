import type { FunnelHealth } from './types';

export function getFunnelAdvisor(health: FunnelHealth): string[] {
  return health.recommendations.length > 0 ? health.recommendations : ['漏斗健康度良好，可以准备启动流量了。'];
}

export function getNextBestAction(health: FunnelHealth): string {
  if (health.ctaStrength < 50) return '检查着陆页和感谢页的 CTA 按钮是否清晰。';
  if (health.followUpReadiness < 50) return '完善 WhatsApp 跟进流程和邮件序列。';
  if (health.trafficReadiness < 50) return '准备至少 3 个广告角度，覆盖不同平台。';
  if (health.trustElements < 50) return '加入更多可信度元素：案例、数据、客户评价。';
  return '漏斗已就绪，可以开始软启动。';
}
