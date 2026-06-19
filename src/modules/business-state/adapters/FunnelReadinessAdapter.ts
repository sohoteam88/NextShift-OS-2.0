import { funnelProgressService } from '@/modules/funnel/services/funnel-progress-service';
import type { BusinessFunnelType } from '@/modules/funnel/types/funnel-context';
import type { BusinessMode } from '@/modules/interview-authority/contracts/BusinessContextSnapshot';
import type { BusinessBottleneck } from '../contracts/BusinessBottleneck';
import type { BusinessOpportunity } from '../contracts/BusinessOpportunity';
import type { BusinessStateAdapterResult, BusinessStateSourceMetadata } from './business-state-adapter-diagnostics';
import { createReadinessScore } from './business-state-adapter-diagnostics';

function funnelTypesFromBusinessMode(businessMode: BusinessMode | undefined): { types: BusinessFunnelType[]; fallback: string | 'none' } {
  if (businessMode === 'retail') return { types: ['retail'], fallback: 'none' };
  if (businessMode === 'recruitment') return { types: ['recruitment'], fallback: 'none' };
  if (businessMode === 'hybrid') return { types: ['retail', 'recruitment'], fallback: 'none' };
  if (businessMode === 'team_building' || businessMode === 'franchise') {
    return { types: ['recruitment'], fallback: 'business_mode_not_exact_funnel_type' };
  }
  return { types: ['retail', 'recruitment'], fallback: 'interview_authority.business_mode_missing' };
}

function severityFromProgress(progress: number): BusinessBottleneck['severity'] {
  if (progress < 35) return 'high';
  if (progress < 70) return 'medium';
  return 'low';
}

function impactFromProgress(progress: number): BusinessOpportunity['impact'] {
  if (progress < 35) return 'high';
  if (progress < 70) return 'medium';
  return 'low';
}

export async function adaptFunnelReadiness(
  userId: string,
  tenantId: string,
  businessMode: BusinessMode | undefined,
): Promise<BusinessStateAdapterResult> {
  const { types, fallback } = funnelTypesFromBusinessMode(businessMode);
  const metadata: BusinessStateSourceMetadata = {
    source: 'funnelProgressService',
    scope: 'user',
    confidence: fallback === 'none' ? 'derived' : 'fallback',
    fallback,
  };

  const progressItems = await Promise.all(types.map((type) => funnelProgressService.getProgress(userId, tenantId, type)));
  const averageProgress = Math.round(progressItems.reduce((sum, item) => sum + item.progress, 0) / Math.max(progressItems.length, 1));

  const bottlenecks = progressItems
    .filter((item) => item.bottleneck)
    .map<BusinessBottleneck>((item) => ({
      ...metadata,
      code: `funnel_${item.funnelType}_${String(item.bottleneck).toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
      title: item.bottleneck ?? 'Funnel bottleneck',
      description: item.bottleneckFix ?? 'Complete the missing funnel step.',
      severity: severityFromProgress(item.progress),
      domain: 'funnel',
    }));

  const opportunities = progressItems
    .filter((item) => item.progress < 100)
    .map<BusinessOpportunity>((item) => ({
      ...metadata,
      code: `funnel_${item.funnelType}_next_${item.nextStage}`,
      title: `Advance ${item.funnelType} funnel`,
      description: `Next funnel stage: ${item.nextStage}`,
      impact: impactFromProgress(item.progress),
      domain: 'funnel',
    }));

  return {
    ...metadata,
    readiness: createReadinessScore(metadata, averageProgress),
    bottlenecks,
    opportunities,
  };
}
