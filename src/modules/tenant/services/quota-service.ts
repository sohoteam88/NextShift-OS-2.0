import { AppError } from '@/lib/errors';
import { tenantService } from './tenant-service';

export const quotaService = {
  async checkFunnelQuota(tenantId: string) {
    const usage = await tenantService.getUsage(tenantId);
    if (usage.funnels.used >= usage.funnels.limit) {
      throw new AppError(
        'QUOTA_EXCEEDED',
        429,
        `Funnel limit reached (${usage.funnels.limit}). Upgrade your plan.`,
      );
    }
  },

  async checkSequenceQuota(tenantId: string) {
    const usage = await tenantService.getUsage(tenantId);
    if (usage.sequences.used >= usage.sequences.limit) {
      throw new AppError(
        'QUOTA_EXCEEDED',
        429,
        `Sequence limit reached (${usage.sequences.limit}). Upgrade your plan.`,
      );
    }
  },
};

