import type { ValueMilestone, ValueRisk, ValueStage } from '../contracts/ValueProjection';
import { hasBusinessOutcome, type OutcomeFacts } from './outcome-tracker';

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function calculateValueRealizationScore(milestones: ValueMilestone[], facts: OutcomeFacts) {
  if (milestones.length === 0) return 0;
  if (milestones.every((milestone) => milestone.achieved)) return 100;

  const milestoneScore = (milestones.filter((milestone) => milestone.achieved).length / milestones.length) * 75;
  const outcomeBonus = Math.min(
    (facts.revenueGenerated > 0 ? 15 : 0)
      + facts.customersAcquired * 8
      + Math.floor(facts.viewsGenerated / 1000) * 5,
    25,
  );

  return clamp(milestoneScore + outcomeBonus);
}

export function valueStageFor(score: number, facts: OutcomeFacts): ValueStage {
  if (score >= 85 || facts.revenueGenerated >= 1000 || facts.teamMembersRecruited >= 3) return 'scaling';
  if (score >= 65 || facts.customersAcquired >= 2 || facts.viewsGenerated >= 1000) return 'growing';
  if (score >= 35 || hasBusinessOutcome(facts)) return 'first_win';
  if (score > 0 || facts.contentPublished > 0) return 'progressing';
  return 'not_started';
}

export function valueRiskFor(stage: ValueStage, facts: OutcomeFacts): ValueRisk {
  if (stage === 'not_started' && facts.contentPublished === 0 && facts.leadsGenerated === 0) return 'high';
  if (stage === 'progressing' && !hasBusinessOutcome(facts)) return 'medium';
  if (stage === 'first_win') return 'low';
  if (stage === 'growing' || stage === 'scaling') return 'low';
  return 'medium';
}
