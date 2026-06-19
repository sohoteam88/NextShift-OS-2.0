import { ceoAdvisorEngine } from '@/modules/business-intelligence/ceoAdvisorEngine';
import type { BusinessBottleneck } from '../contracts/BusinessBottleneck';
import type { BusinessOpportunity } from '../contracts/BusinessOpportunity';
import type { BusinessStateAdapterResult, BusinessStateSourceMetadata } from './business-state-adapter-diagnostics';
import { createReadinessScore } from './business-state-adapter-diagnostics';

const DOMAIN_MAP: Record<string, BusinessBottleneck['domain']> = {
  brand: 'brand',
  content: 'content',
  traffic: 'traffic',
  funnel: 'funnel',
  lead: 'funnel',
  growth: 'funnel',
  crm: 'crm',
  sales: 'sales',
  automation: 'crm',
};

function mapDomain(value: string | undefined): BusinessBottleneck['domain'] {
  return DOMAIN_MAP[String(value ?? '').toLowerCase()] ?? 'sales';
}

function mapSeverity(value: string): BusinessBottleneck['severity'] {
  if (value === 'critical') return 'high';
  if (value === 'high' || value === 'medium' || value === 'low') return value;
  return 'medium';
}

function mapImpact(score: number): BusinessOpportunity['impact'] {
  if (score >= 80) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
}

export async function adaptCEOAdvisorState(userId: string, tenantId: string): Promise<BusinessStateAdapterResult> {
  const report = await ceoAdvisorEngine.generateCEOReport(userId, tenantId);
  const metadata: BusinessStateSourceMetadata = {
    source: 'ceoAdvisorEngine',
    scope: 'user',
    confidence: 'derived',
    fallback: 'none',
  };

  return {
    ...metadata,
    readiness: createReadinessScore(metadata, report.health.overallScore),
    bottlenecks: report.bottlenecks.map((item) => ({
      ...metadata,
      code: `ceo_${item.id}`,
      title: item.description,
      description: item.recommendation || item.impact,
      severity: mapSeverity(item.severity),
      domain: mapDomain(item.category),
    })),
    opportunities: report.opportunities.map((item) => ({
      ...metadata,
      code: `ceo_${item.id}`,
      title: item.opportunity,
      description: item.explanation,
      impact: mapImpact(item.impactScore),
      domain: mapDomain(item.agentRecommended),
    })),
  };
}
