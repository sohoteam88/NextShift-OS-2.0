import type { SocialReadinessResult } from '@/modules/social-setup/types';
import type { BusinessState } from '../contracts/BusinessState';

function unique(items: string[]): string[] {
  return [...new Set(items.filter(Boolean))];
}

export function toSocialReadinessViewModel(state: BusinessState): SocialReadinessResult {
  const score = state.readiness.percentage;
  const socialBottlenecks = state.bottlenecks.filter((item) => (
    item.source === 'socialSetupService.getReadiness'
    || item.code.startsWith('social_')
  ));
  const missingItems = unique(socialBottlenecks.map((item) => item.description));
  const recommendations = socialBottlenecks.length > 0
    ? unique(socialBottlenecks.map((item) => `处理社交媒体设置缺口：${item.description}`)).slice(0, 5)
    : ['社交媒体基础设置没有发现明确缺口。'];

  return {
    score,
    facebookCompleteness: score,
    instagramCompleteness: score,
    bioClarity: score,
    ctaClarity: score,
    visualConsistency: score,
    linkStrategy: score,
    missingItems,
    recommendations,
  };
}
