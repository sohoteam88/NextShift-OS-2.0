import { ceoAdvisorEngine } from '@/modules/business-intelligence/ceoAdvisorEngine';
import type { CEOReport, NextBestAction } from '@/modules/business-intelligence/types';
import type {
  COORecommendation,
  COORecommendationDomain,
  COORecommendationPriority,
} from '../contracts/COORecommendation';

export type CEORecommendationAdapterResult = {
  report: CEOReport;
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
    source: 'ceoAdvisorEngine.generateCEOReport',
    scope: 'user',
    confidence: 'derived',
    fallback: 'none',

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
  const report = await ceoAdvisorEngine.generateCEOReport(userId, tenantId);

  return {
    report,
    recommendations: mapCEOReportToCOORecommendations(report),
  };
}
