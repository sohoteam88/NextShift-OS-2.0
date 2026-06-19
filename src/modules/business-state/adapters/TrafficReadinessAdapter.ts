import { trafficEngineService } from '@/modules/traffic-engine/trafficEngineService';
import type { BusinessBottleneck } from '../contracts/BusinessBottleneck';
import type { BusinessOpportunity } from '../contracts/BusinessOpportunity';
import type { BusinessStateAdapterResult, BusinessStateSourceMetadata } from './business-state-adapter-diagnostics';
import { createReadinessScore } from './business-state-adapter-diagnostics';

function severityFromScore(score: number): BusinessBottleneck['severity'] {
  if (score < 40) return 'high';
  if (score < 75) return 'medium';
  return 'low';
}

function impactFromScore(score: number): BusinessOpportunity['impact'] {
  if (score < 40) return 'high';
  if (score < 75) return 'medium';
  return 'low';
}

export async function adaptTrafficReadiness(userId: string): Promise<BusinessStateAdapterResult> {
  const pkg = await trafficEngineService.get(userId);
  const metadata: BusinessStateSourceMetadata = {
    source: 'trafficEngineService.get',
    scope: 'user',
    confidence: pkg ? 'derived' : 'fallback',
    fallback: pkg ? 'none' : 'traffic_package_missing',
  };

  if (!pkg) {
    return {
      ...metadata,
      readiness: createReadinessScore(metadata, 0),
      bottlenecks: [{
        ...metadata,
        code: 'traffic_package_missing',
        title: 'Traffic package missing',
        description: 'No saved traffic readiness package is available.',
        severity: 'medium',
        domain: 'traffic',
      }],
      opportunities: [{
        ...metadata,
        code: 'traffic_prepare_first_package',
        title: 'Prepare traffic package',
        description: 'Create a traffic package when the funnel and content assets are ready.',
        impact: 'medium',
        domain: 'traffic',
      }],
    };
  }

  return {
    ...metadata,
    readiness: createReadinessScore(metadata, pkg.readiness.score),
    bottlenecks: pkg.readiness.missingItems.map((item) => ({
      ...metadata,
      code: `traffic_${item.replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase()}`,
      title: 'Traffic readiness gap',
      description: item,
      severity: severityFromScore(pkg.readiness.score),
      domain: 'traffic',
    })),
    opportunities: pkg.readiness.recommendations.map((recommendation, index) => ({
      ...metadata,
      code: `traffic_recommendation_${index + 1}`,
      title: 'Improve traffic readiness',
      description: recommendation,
      impact: impactFromScore(pkg.readiness.score),
      domain: 'traffic',
    })),
  };
}
