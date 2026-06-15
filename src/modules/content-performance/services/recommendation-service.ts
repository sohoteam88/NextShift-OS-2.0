// Recommendation Service — tells users what content to create next

import type { ContentRecommendation, ContentPerformance, BenchmarkGroup } from '../types/performance.types';
import { benchmarkByPillar, benchmarkByPlatform } from './benchmark-service';
import { getBestContent } from './performance-service';

export function getContentRecommendations(items: ContentPerformance[]): ContentRecommendation[] {
  const recommendations: ContentRecommendation[] = [];
  const best = getBestContent(items, 3);

  // Best pillar recommendation
  if (best.length > 0) {
    const bestPillar = best[0].pillar;
    const pillarBench = benchmarkByPillar(items);
    const bestGroup = pillarBench.groups[0];
    if (bestGroup && bestGroup.count >= 2) {
      recommendations.push({
        action: `Create more ${bestGroup.label} content`,
        reason: `${bestGroup.label} posts get ${bestGroup.avgEngagement} avg engagement vs ${pillarBench.groups[pillarBench.groups.length - 1]?.avgEngagement ?? 0} for other types.`,
        expectedImpact: `Higher engagement and reach`,
        suggestedPillar: bestGroup.label,
      });
    }
  }

  // Underperforming content warning
  const worst = items.filter(i => i.performanceScore < 30);
  if (worst.length > 0) {
    const worstPlatform = worst[0].platform;
    recommendations.push({
      action: 'Improve your hooks',
      reason: `${worst.length} posts on ${worstPlatform} are underperforming. Weak hooks reduce reach.`,
      expectedImpact: '2-3x reach improvement',
      suggestedPlatform: worstPlatform,
    });
  }

  // Platform recommendation
  if (items.length >= 5) {
    const platformBench = benchmarkByPlatform(items);
    const bestPlatform = platformBench.groups[0];
    if (bestPlatform) {
      recommendations.push({
        action: `Focus on ${bestPlatform.label}`,
        reason: `${bestPlatform.label} drives ${bestPlatform.avgLeads > 0 ? 'leads' : 'engagement'} best for your audience.`,
        expectedImpact: `Higher ROI`,
        suggestedPlatform: bestPlatform.label,
      });
    }
  }

  return recommendations.slice(0, 3);
}
