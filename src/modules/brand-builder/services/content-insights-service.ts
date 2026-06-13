import { getRouterForTenant } from '@/modules/ai/router';
import { enforceQuota } from '@/modules/ai/usage/quota';
import { logAIUsage } from '@/modules/ai/usage/tracker';
import { postPerformanceService } from './post-performance-service';
import { getBrandContext } from '@/modules/brand-dna/services/BrandContextProvider';
import type { AuthUser } from '@/modules/auth/services/auth-service';

/** @deprecated Use getBrandContext() directly. */
async function getBrandProfile(userId: string) {
  return getBrandContext(userId);
}

export type ContentInsights = {
  insufficient_data?: boolean;
  message?: string;
  minimum?: number;
  current?: number;
  summary?: string;
  best_pillar?: { name: string; avg_reach: number; reason: string };
  worst_pillar?: { name: string; avg_reach: number; suggestion: string };
  best_format?: { format: string; reason: string };
  recommendations?: Array<{
    priority: 'high' | 'medium' | 'low';
    action: string;
    reason: string;
    expected_impact: string;
  }>;
  pillar_adjustment?: {
    increase?: { pillar: string; from_pct: number; to_pct: number; reason: string };
    decrease?: { pillar: string; from_pct: number; to_pct: number; reason: string };
  };
  posting_insights?: string;
  next_30_day_focus?: string;
  raw_text?: string;
};

export const contentInsightsService = {
  async analyze(user: AuthUser): Promise<ContentInsights> {
    await enforceQuota(user.tenantId);

    const stats = await postPerformanceService.getStats(user, '30d');
    if (!stats || stats.total < 5) {
      return {
        insufficient_data: true,
        message: '至少需要 5 条发布数据才能分析',
        minimum: 5,
        current: stats?.total ?? 0,
      };
    }

    const brandProfile = await getBrandProfile(user.id);

    const systemPrompt = `You are a social media analytics expert for the Malaysian Chinese market.
Analyze the content performance data and provide actionable optimization recommendations.

Return JSON:
{
  "summary": "Overall performance summary in 2-3 sentences",
  "best_pillar": { "name": "...", "avg_reach": N, "reason": "Why it works" },
  "worst_pillar": { "name": "...", "avg_reach": N, "suggestion": "How to improve" },
  "best_format": { "format": "post/reel/story", "reason": "Why" },
  "recommendations": [
    { "priority": "high", "action": "Specific action", "reason": "Why", "expected_impact": "What will improve" }
  ],
  "pillar_adjustment": {
    "increase": { "pillar": "...", "from_pct": N, "to_pct": N, "reason": "..." },
    "decrease": { "pillar": "...", "from_pct": N, "to_pct": N, "reason": "..." }
  },
  "posting_insights": "Observations about timing, frequency",
  "next_30_day_focus": "What to focus on next month"
}`;

    const userMessage = `Performance data (last 30 days):
Total posts: ${stats.total}
Avg reach: ${stats.avgReach}
Avg likes: ${stats.avgLikes}
Avg comments: ${stats.avgComments}
Engagement rate: ${stats.engagementRate}%

By pillar: ${JSON.stringify(stats.byPillar)}
By format: ${JSON.stringify(stats.byFormat)}
By platform: ${JSON.stringify(stats.byPlatform)}

Current content pillars: ${JSON.stringify(brandProfile?.contentPillars ?? [])}`;

    const router = await getRouterForTenant(user.tenantId);
    const result = await router.generate(
      {
        systemPrompt,
        userMessage,
        temperature: 0.4,
        maxTokens: 1500,
      },
      'content_insights',
    );

    await logAIUsage({
      tenantId: user.tenantId,
      userId: user.id,
      feature: 'content_insights',
      result,
      routing: result.routing,
    });

    try {
      return JSON.parse(
        result.text.replace(/```json\n?/g, '').replace(/```/g, '').trim(),
      ) as ContentInsights;
    } catch {
      return { raw_text: result.text };
    }
  },
};
