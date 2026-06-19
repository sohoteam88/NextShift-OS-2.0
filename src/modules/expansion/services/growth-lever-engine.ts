import type { InterviewAuthorityBusinessMode } from '@/modules/interview-authority/contracts/InterviewAuthorityProjection';
import type { ExpansionMetrics, ExpansionOpportunity, ExpansionProjection, ExpansionRisk, GrowthLever } from '../contracts/ExpansionProjection';
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
  team_growth: { lever: 'team_growth', title: '扩大团队增长', route: '/team/growth', metric: 'team' },
};

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
        title: copy.title,
        reason: metric.growthRate > 0
          ? `${definition.title} is already moving at ${metric.growthRate}% growth. Multiply what is working.`
          : `${definition.title} is the next leverage point for this business mode.`,
        route: definition.route,
        priority: priorityFor(metric.growthRate),
        expectedMetricLift: copy.expectedMetricLift,
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

  if (facts.valueProjection.currentValueStage === 'not_started' || facts.valueProjection.currentValueStage === 'progressing') {
    risks.push({
      code: 'expansion_value_not_proven',
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
        lever,
        title: `${definition.title} missing`,
        reason: `No current ${definition.metric} signal exists in the last 30 days, so this lever cannot be scaled yet.`,
        route: definition.route,
        priority: 'medium',
      });
    } else if (metric.growthRate < 0) {
      risks.push({
        code: `expansion_${lever}_declining`,
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
