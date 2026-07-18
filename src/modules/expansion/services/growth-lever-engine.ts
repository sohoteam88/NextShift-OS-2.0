import type { InterviewAuthorityBusinessMode } from '@/modules/interview-authority/contracts/InterviewAuthorityProjection';
import type { ExpansionMetrics, ExpansionOpportunity, ExpansionOpportunityId, ExpansionProjection, ExpansionRecoveryAction, ExpansionRisk, GrowthLever } from '../contracts/ExpansionProjection';
import type { ExpansionFacts } from './expansion-facts';

type LeverDefinition = {
  lever: GrowthLever;
  title: string;
  route: string;
  metric: keyof ExpansionMetrics;
};

const LEVERS: Record<GrowthLever, LeverDefinition> = {
  lead_growth: { lever: 'lead_growth', title: '增加潜在客户增长', route: '/lead-magnet', metric: 'leads' },
  customer_growth: { lever: 'customer_growth', title: '增加客户获取', route: '/customers', metric: 'customers' },
  revenue_growth: { lever: 'revenue_growth', title: '增加收入增长', route: '/sales', metric: 'revenue' },
  audience_growth: { lever: 'audience_growth', title: '扩大受众增长', route: '/analytics', metric: 'audience' },
  content_growth: { lever: 'content_growth', title: '提高内容产出', route: '/content-engine', metric: 'content' },
  team_growth: { lever: 'team_growth', title: '扩大团队增长', route: '/ai-workforce', metric: 'team' },
};

const OPPORTUNITY_SEQUENCE: ExpansionOpportunityId[] = [
  'FIRST_CUSTOMER',
  'FIRST_REVENUE',
  'RETENTION_SYSTEM',
  'TEAM_SCALING',
  'AUTHORITY_BUILDING',
  'MARKET_LEADERSHIP',
];

function parseDate(value?: Date | string | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysSince(value: Date | string | null | undefined, generatedAt: string) {
  const date = parseDate(value);
  if (!date) return null;
  return Math.max(0, Math.floor((new Date(generatedAt).getTime() - date.getTime()) / 86_400_000));
}

function inferredOutcomeCount(facts: ExpansionFacts) {
  if (typeof facts.outcomeCount === 'number') return Math.max(0, Math.round(facts.outcomeCount));

  let count = 0;
  if (facts.metrics.customers.current > 0 || facts.metrics.customers.previous > 0) count += 1;
  if (facts.metrics.revenue.current > 0 || facts.metrics.revenue.previous > 0) count += 1;
  if (facts.retentionProjection.outcomeRetention?.retained) count += 1;
  if (facts.metrics.team.current > 0 || facts.metrics.team.previous > 0) count += 1;
  if (facts.metrics.audience.current >= 5000 && facts.metrics.content.current >= 12) count += 1;
  return count;
}

function opportunityForFacts(facts: ExpansionFacts): ExpansionOpportunityId {
  const count = inferredOutcomeCount(facts);
  return OPPORTUNITY_SEQUENCE[Math.min(count, OPPORTUNITY_SEQUENCE.length - 1)];
}

function opportunityForLever(facts: ExpansionFacts, lever: GrowthLever): ExpansionOpportunityId {
  if (lever === 'revenue_growth') return 'FIRST_REVENUE';
  if (lever === 'team_growth') return 'TEAM_SCALING';
  if (lever === 'content_growth' || lever === 'audience_growth') {
    return facts.metrics.team.current > 0 || facts.metrics.team.previous > 0 ? 'MARKET_LEADERSHIP' : 'AUTHORITY_BUILDING';
  }
  if (lever === 'customer_growth') {
    return facts.retentionProjection.outcomeRetention?.retained ? 'RETENTION_SYSTEM' : 'FIRST_CUSTOMER';
  }
  return opportunityForFacts(facts);
}

function priorityFor(rate: number): ExpansionOpportunity['priority'] {
  if (rate >= 50) return 'high';
  if (rate >= 15) return 'medium';
  return 'low';
}

function primaryLeversFor(mode: InterviewAuthorityBusinessMode): GrowthLever[] {
  switch (mode) {
    case 'creator':
      return ['content_growth', 'audience_growth', 'lead_growth'];
    case 'service':
      return ['lead_growth', 'customer_growth', 'revenue_growth'];
    case 'team_building':
      return ['team_growth', 'lead_growth', 'content_growth'];
    case 'hybrid':
      return ['content_growth', 'lead_growth', 'customer_growth', 'revenue_growth'];
    case 'retail':
    default:
      return ['customer_growth', 'revenue_growth', 'lead_growth'];
  }
}

function opportunityCopy(lever: GrowthLever) {
  switch (lever) {
    case 'content_growth':
      return {
        title: '提高发布频率',
        expectedMetricLift: 'Increase published content count.',
      };
    case 'audience_growth':
      return {
        title: '扩大内容分发渠道',
        expectedMetricLift: 'Increase reach and impressions.',
      };
    case 'lead_growth':
      return {
        title: '增加潜在客户来源',
        expectedMetricLift: 'Increase lead growth rate.',
      };
    case 'customer_growth':
      return {
        title: '提高客户获取',
        expectedMetricLift: 'Increase customer growth rate.',
      };
    case 'revenue_growth':
      return {
        title: '提高客单价或复购',
        expectedMetricLift: 'Increase revenue growth rate.',
      };
    case 'team_growth':
      return {
        title: '增加招募和复制',
        expectedMetricLift: 'Increase team growth rate.',
      };
  }
}

export function detectExpansionOpportunities(facts: ExpansionFacts): ExpansionOpportunity[] {
  const primaryLevers = primaryLeversFor(facts.businessMode);

  return primaryLevers
    .map((lever) => {
      const definition = LEVERS[lever];
      const metric = facts.metrics[definition.metric];
      const copy = opportunityCopy(lever);

      return {
        id: `expand_${lever}`,
        lever,
        opportunity: opportunityForLever(facts, lever),
        title: copy.title,
        reason: metric.growthRate > 0
          ? `${definition.title} is already moving at ${metric.growthRate}% growth. Multiply what is working.`
          : `${definition.title} is the next leverage point for this business mode.`,
        route: definition.route,
        priority: priorityFor(metric.growthRate),
        expectedMetricLift: copy.expectedMetricLift,
        personalizedBy: ['businessMode', 'stage', 'region'] as ExpansionOpportunity['personalizedBy'],
      };
    })
    .sort((a, b) => {
      const priorityRank = { high: 3, medium: 2, low: 1 };
      const byPriority = priorityRank[b.priority] - priorityRank[a.priority];
      if (byPriority !== 0) return byPriority;
      return primaryLevers.indexOf(a.lever) - primaryLevers.indexOf(b.lever);
    });
}

export function detectExpansionRisks(facts: ExpansionFacts): ExpansionRisk[] {
  const risks: ExpansionRisk[] = [];
  const daysSinceRevenueGrowth = daysSince(facts.lastRevenueGrowthAt, facts.generatedAt);
  const daysSinceLastOutcome = daysSince(facts.lastOutcomeAt, facts.generatedAt);
  const daysSinceTeamProgress = daysSince(facts.lastTeamProgressAt, facts.generatedAt);

  if (daysSinceRevenueGrowth !== null && daysSinceRevenueGrowth >= 30) {
    risks.push({
      code: 'expansion_plateau',
      riskCode: 'PLATEAU',
      lever: 'revenue_growth',
      title: 'Revenue growth plateau detected',
      reason: 'No revenue growth has been detected for 30 days.',
      route: '/sales',
      priority: 'high',
    });
  }

  if (daysSinceLastOutcome !== null && daysSinceLastOutcome >= 45) {
    risks.push({
      code: 'expansion_stalled_growth',
      riskCode: 'STALLED_GROWTH',
      lever: 'customer_growth',
      title: 'Outcome growth stalled',
      reason: 'No new verified outcome has been detected for 45 days.',
      route: '/mission',
      priority: 'high',
    });
  }

  if (daysSinceTeamProgress !== null && daysSinceTeamProgress >= 60) {
    risks.push({
      code: 'expansion_scaling_blocked',
      riskCode: 'SCALING_BLOCKED',
      lever: 'team_growth',
      title: 'Scaling blocked',
      reason: 'No team progress has been detected for 60 days.',
      route: '/ai-workforce',
      priority: 'medium',
    });
  }

  if (facts.valueProjection.currentValueStage === 'not_started' || facts.valueProjection.currentValueStage === 'progressing') {
    risks.push({
      code: 'expansion_value_not_proven',
      riskCode: 'VALUE_NOT_PROVEN',
      lever: 'revenue_growth',
      title: 'Value not proven enough to scale',
      reason: 'The user should prove a meaningful business outcome before multiplying growth activity.',
      route: facts.valueProjection.recommendedValueAction.route,
      priority: 'high',
    });
  }

  const primaryLevers = primaryLeversFor(facts.businessMode);
  for (const lever of primaryLevers) {
    const definition = LEVERS[lever];
    const metric = facts.metrics[definition.metric];
    if (metric.current === 0) {
      risks.push({
        code: `expansion_${lever}_missing`,
        riskCode: 'LEVER_MISSING',
        lever,
        title: `${definition.title} missing`,
        reason: `No current ${definition.metric} signal exists in the last 30 days, so this lever cannot be scaled yet.`,
        route: definition.route,
        priority: 'medium',
      });
    } else if (metric.growthRate < 0) {
      risks.push({
        code: `expansion_${lever}_declining`,
        riskCode: 'LEVER_DECLINING',
        lever,
        title: `${definition.title} declining`,
        reason: `${definition.title} is down ${Math.abs(metric.growthRate)}% versus the previous period.`,
        route: definition.route,
        priority: 'high',
      });
    }
  }

  return risks.slice(0, 3);
}

export function recoveryActionForRisk(risk: ExpansionRisk | undefined): ExpansionRecoveryAction {
  if (!risk) return 'expansion_outcome';
  if (risk.riskCode === 'PLATEAU') return 'optimization_mission';
  if (risk.riskCode === 'SCALING_BLOCKED') return 'workforce_assistance';
  if (risk.riskCode === 'STALLED_GROWTH') return 'growth_mission';
  return 'expansion_outcome';
}

export function selectCurrentGrowthLever(facts: ExpansionFacts, opportunities: ExpansionOpportunity[]): ExpansionProjection['currentGrowthLever'] {
  const opportunity = opportunities[0];
  const definition = opportunity ? LEVERS[opportunity.lever] : LEVERS[primaryLeversFor(facts.businessMode)[0]];

  return {
    lever: definition.lever,
    title: opportunity?.title ?? definition.title,
    reason: opportunity?.reason ?? `${definition.title} is the clearest available growth lever.`,
    route: opportunity?.route ?? definition.route,
  };
}

export function nextMilestoneFor(facts: ExpansionFacts, lever: GrowthLever): ExpansionProjection['nextGrowthMilestone'] {
  const definition = LEVERS[lever];
  const metric = facts.metrics[definition.metric];
  const targetValue = metric.current === 0 ? 1 : Math.max(metric.current + 1, Math.ceil(metric.current * 1.25));

  return {
    title: `Reach ${targetValue} ${definition.metric}`,
    metric: lever,
    target: `${definition.metric}: ${targetValue}`,
    route: definition.route,
  };
}
