import { ceoAdvisorEngine } from '@/modules/business-intelligence/ceoAdvisorEngine';
import type { CEOReport, NextBestAction } from '@/modules/business-intelligence/types';
import type {
  COORecommendation,
  COORecommendationDomain,
  COORecommendationPriority,
} from '../contracts/COORecommendation';
import {
  adaptBusinessStateProjection,
  mapBusinessStateProjectionToCOORecommendations,
  type BusinessStateProjection,
} from './BusinessStateProjectionAdapter';
import { emitCOORecommendationGenerated } from '../telemetry/coo-telemetry';

export type CEORecommendationAdapterResult = {
  source: 'business_state' | 'fallback_ceo_advisor';
  report?: CEOReport;
  businessState?: BusinessStateProjection;
  recommendations: COORecommendation[];
};

function domainFromAction(action: NextBestAction): COORecommendationDomain {
  const value = `${action.action} ${action.agentRecommended}`.toLowerCase();

  if (value.includes('content') || value.includes('内容')) return 'content';
  if (value.includes('traffic') || value.includes('流量')) return 'traffic';
  if (value.includes('funnel') || value.includes('漏斗') || value.includes('引流')) return 'funnel';
  if (value.includes('crm') || value.includes('lead') || value.includes('客户')) return 'crm';
  if (value.includes('sales') || value.includes('销售') || value.includes('成交')) return 'sales';
  if (value.includes('team') || value.includes('团队')) return 'team';
  if (value.includes('brand') || value.includes('品牌')) return 'brand';

  return 'operations';
}

function priorityFromAction(action: NextBestAction): COORecommendationPriority {
  if (action.priority <= 1) return 'high';
  if (action.priority === 2) return 'medium';
  return 'low';
}

export function mapCEOReportToCOORecommendations(report: CEOReport): COORecommendation[] {
  return report.actions.map((action) => ({
    source: 'fallback_ceo_advisor',
    scope: 'user',
    confidence: 'fallback',
    fallback: 'business_state_unavailable',
    recommendationSource: 'fallback',

    id: `ceo-action-${action.priority}`,
    type: 'strategic',
    title: action.action,
    summary: action.expectedImpact,
    domain: domainFromAction(action),
    priority: priorityFromAction(action),
    horizon: action.priority <= 1 ? 'week' : 'month',
    reasoning: [
      report.summary,
      `CEO Advisor recommended agent: ${action.agentRecommended}`,
    ],
    expectedOutcome: action.expectedImpact,
    supportingSignals: [
      `business-health:${report.health.overallScore}`,
      `bottlenecks:${report.bottlenecks.length}`,
      `opportunities:${report.opportunities.length}`,
      `risks:${report.risks.length}`,
    ],
    relatedRoute: action.route,
  }));
}

export async function adaptCEORecommendations(
  userId: string,
  tenantId: string,
): Promise<CEORecommendationAdapterResult> {
  try {
    const businessState = await adaptBusinessStateProjection(userId);
    const recommendations = mapBusinessStateProjectionToCOORecommendations(businessState);

    emitCOORecommendationGenerated({
      userId,
      tenantId,
      recommendationSource: 'business_state',
      businessStage: businessState.businessStage,
      readiness: businessState.readiness.percentage,
      bottleneckCount: businessState.bottlenecks.length,
    });

    return {
      source: 'business_state',
      businessState,
      recommendations,
    };
  } catch {
    const report = await ceoAdvisorEngine.generateCEOReport(userId, tenantId);
    const recommendations = mapCEOReportToCOORecommendations(report);

    emitCOORecommendationGenerated({
      userId,
      tenantId,
      recommendationSource: 'fallback',
      readiness: report.health.overallScore,
      bottleneckCount: report.bottlenecks.length,
    });

    return {
      source: 'fallback_ceo_advisor',
      report,
      recommendations,
    };
  }
}
