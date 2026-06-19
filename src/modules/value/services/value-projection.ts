import type { ValueMilestone, ValueProjection } from '../contracts/ValueProjection';
import { hasBusinessOutcome, type OutcomeFacts } from './outcome-tracker';
import { buildValueMilestones } from './milestone-engine';
import { calculateValueRealizationScore, valueRiskFor, valueStageFor } from './value-score-engine';

function latestAchieved(milestones: ValueMilestone[]) {
  return milestones
    .filter((milestone) => milestone.achieved && milestone.achievedAt)
    .sort((a, b) => String(b.achievedAt).localeCompare(String(a.achievedAt)))[0] ?? null;
}

function blockerFor(facts: OutcomeFacts, nextMilestone: ValueMilestone | null): ValueProjection['blockers'] {
  if (!nextMilestone) return [];
  if (facts.leadsGenerated === 0 && ['first_lead', 'first_prospect'].includes(nextMilestone.id)) {
    return [{
      code: 'no_leads_generated',
      title: 'No leads generated',
      reason: 'No qualified lead has been captured, so value realization is still unproven.',
      route: '/lead-magnet',
    }];
  }
  if (facts.contentPublished === 0 && nextMilestone.id === 'first_content_published') {
    return [{
      code: 'no_content_published',
      title: 'No content published',
      reason: 'The creator path needs a published asset before views or audience learning can happen.',
      route: '/content-engine',
    }];
  }
  if (facts.customersAcquired === 0 && ['first_customer', 'first_client', 'first_sale'].includes(nextMilestone.id)) {
    return [{
      code: 'no_customer_outcome',
      title: 'No customer outcome yet',
      reason: 'Lead flow exists, but no customer or sale has been recorded yet.',
      route: '/crm',
    }];
  }
  return [{
    code: 'next_value_milestone_pending',
    title: `${nextMilestone.label} pending`,
    reason: 'The next meaningful business outcome has not been completed yet.',
    route: nextMilestone.route,
  }];
}

function recommendedAction(nextMilestone: ValueMilestone | null, blockers: ValueProjection['blockers']): ValueProjection['recommendedValueAction'] {
  const route = blockers[0]?.route ?? nextMilestone?.route ?? '/dashboard';
  const title = nextMilestone ? `Reach ${nextMilestone.label}` : 'Scale proven value';

  return {
    title,
    route,
    reason: blockers[0]?.reason ?? 'Meaningful value has been proven. Continue scaling the working path.',
    expectedOutcome: nextMilestone?.label ?? 'More business outcomes',
  };
}

export function buildValueProjection(facts: OutcomeFacts): ValueProjection {
  const milestones = buildValueMilestones(facts);
  const score = calculateValueRealizationScore(milestones, facts);
  const currentValueStage = valueStageFor(score, facts);
  const valueRisk = valueRiskFor(currentValueStage, facts);
  const latestWin = latestAchieved(milestones);
  const nextMilestone = milestones.find((milestone) => !milestone.achieved) ?? null;
  const blockers = blockerFor(facts, nextMilestone);

  return {
    source: 'ValueRealizationEngine',
    scope: 'user',
    confidence: hasBusinessOutcome(facts) || facts.contentPublished > 0 ? 'derived' : 'fallback',
    fallback: hasBusinessOutcome(facts) || facts.contentPublished > 0 ? 'none' : 'no_value_outcomes_recorded',
    generatedAt: facts.generatedAt,
    businessMode: facts.businessMode,
    valueRealizationScore: score,
    currentValueStage,
    valueRisk,
    outcomeMetrics: {
      leadsGenerated: facts.leadsGenerated,
      appointmentsBooked: facts.appointmentsBooked,
      customersAcquired: facts.customersAcquired,
      revenueGenerated: facts.revenueGenerated,
      teamMembersRecruited: facts.teamMembersRecruited,
      contentPublished: facts.contentPublished,
      viewsGenerated: facts.viewsGenerated,
    },
    milestones,
    latestWin,
    nextMilestone,
    blockers,
    recommendedValueAction: recommendedAction(nextMilestone, blockers),
    kpis: {
      firstLeadRate: facts.leadsGenerated > 0 ? 100 : 0,
      firstCustomerRate: facts.customersAcquired > 0 ? 100 : 0,
      firstSaleRate: facts.revenueGenerated > 0 || facts.firstSaleAt ? 100 : 0,
      revenueGenerated: facts.revenueGenerated,
      customerSuccessRate: score >= 35 ? 100 : 0,
    },
  };
}
