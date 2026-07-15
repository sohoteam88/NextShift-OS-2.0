import { runtimeFallbackLogger } from '@/lib/runtime-fallback-logger';
import { businessContextMemoryService } from '@/modules/business-context-memory/services/business-context-memory-service';
import type { WeeklyReviewProjection } from '@/modules/business-context-memory/services/weekly-review-projection';

export type WeeklyReviewUser = {
  id: string;
  tenantId: string | null;
};

export type WeeklyReviewResult = WeeklyReviewProjection;

export type WeeklyReviewDependencies = {
  loadWeeklyReview?: typeof businessContextMemoryService.getWeeklyReview;
};

export async function getWeeklyReview(
  user: WeeklyReviewUser,
  dependencies: WeeklyReviewDependencies = {},
): Promise<WeeklyReviewResult | null> {
  const tenantId = user.tenantId;
  if (!tenantId) {
    runtimeFallbackLogger.warn('[weekly-review] unavailable without tenant context', {
      userId: user.id,
    });
    return null;
  }

  try {
    return await (dependencies.loadWeeklyReview ?? businessContextMemoryService.getWeeklyReview)(
      user.id,
      tenantId,
    );
  } catch (error) {
    runtimeFallbackLogger.warn('[weekly-review] unable to load weekly review', {
      userId: user.id,
      tenantId,
      error: error instanceof Error ? error.message : 'unknown error',
    });
    return null;
  }
}
