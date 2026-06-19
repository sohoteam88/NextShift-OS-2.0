import { socialSetupService } from '@/modules/social-setup/socialSetupService';
import type { BusinessBottleneck } from '../contracts/BusinessBottleneck';
import type { BusinessStateAdapterResult, BusinessStateSourceMetadata } from './business-state-adapter-diagnostics';
import { createReadinessScore } from './business-state-adapter-diagnostics';

function severityFromScore(score: number): BusinessBottleneck['severity'] {
  if (score < 40) return 'high';
  if (score < 75) return 'medium';
  return 'low';
}

export async function adaptSocialReadiness(userId: string): Promise<BusinessStateAdapterResult> {
  const readiness = await socialSetupService.getReadiness(userId);
  const metadata: BusinessStateSourceMetadata = {
    source: 'socialSetupService.getReadiness',
    scope: 'user',
    confidence: 'derived',
    fallback: 'none',
  };

  return {
    ...metadata,
    readiness: createReadinessScore(metadata, readiness.score),
    bottlenecks: readiness.missingItems.map((item) => ({
      ...metadata,
      code: `social_${item.replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase()}`,
      title: 'Social setup incomplete',
      description: item,
      severity: severityFromScore(readiness.score),
      domain: 'brand',
    })),
    opportunities: [],
  };
}
