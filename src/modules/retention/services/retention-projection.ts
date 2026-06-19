import type { MomentumWin, RetentionProjection, RetentionSignal } from '../contracts/RetentionProjection';
import { inactivityFlagFor, retentionRiskFor, retentionStateFor } from './engagement-detector';
import { calculateMomentumScore, currentMomentumFor, currentStreakFromActiveDays } from './momentum-engine';
import {
  calculateRetentionScore,
  daysInactive,
  executionConsistency,
  missionCompletionRate,
  type RetentionFacts,
} from './retention-score-engine';

function signal(key: string, label: string, value: number, target: number, unit: RetentionSignal['unit']): RetentionSignal {
  return { key, label, value, target, unit };
}

function reEngagementFor(input: {
  risk: RetentionProjection['retentionRisk'];
  state: RetentionProjection['retentionState'];
  daysInactive: number;
}): RetentionProjection['reEngagement'] {
  const needed = input.risk !== 'low' || input.state === 'at_risk' || input.state === 'inactive' || input.state === 'churn_risk';

  if (!needed) {
    return {
      needed: false,
      priority: 'low',
      title: 'Keep the current rhythm',
      reason: 'The user is returning and completing enough actions to maintain momentum.',
      route: '/dashboard',
    };
  }

  return {
    needed: true,
    priority: input.risk,
    title: input.daysInactive >= 7 ? 'Restart with one quick win' : 'Protect today’s momentum',
    reason: `${input.daysInactive} days inactive. Re-engage with one low-friction mission before suggesting growth work.`,
    route: '/dashboard',
  };
}

export function buildRetentionProjection(input: RetentionFacts & { recentWins: MomentumWin[] }): RetentionProjection {
  const retentionScore = calculateRetentionScore(input);
  const momentumScore = calculateMomentumScore(input);
  const inactiveDays = daysInactive(input);
  const retentionState = retentionStateFor({ facts: input, retentionScore, momentumScore });
  const retentionRisk = retentionRiskFor(inactiveDays);

  return {
    source: 'RetentionEngine',
    scope: 'user',
    confidence: input.activeDays30d > 0 || input.missionCompleted30d > 0 ? 'derived' : 'fallback',
    fallback: input.activeDays30d > 0 || input.missionCompleted30d > 0 ? 'none' : 'insufficient_retention_history',
    generatedAt: input.generatedAt,
    retentionScore,
    retentionState,
    retentionRisk,
    momentumScore,
    currentMomentum: currentMomentumFor({ score: momentumScore, recentWins: input.recentWins }),
    currentStreak: currentStreakFromActiveDays(input.activeDays30d),
    daysInactive: inactiveDays,
    inactivityFlag: inactivityFlagFor(inactiveDays),
    signals: {
      loginFrequency: signal('login_frequency', 'Login frequency', input.loginEvents30d, 8, 'count'),
      missionCompletionFrequency: signal('mission_completion_frequency', 'Mission completion frequency', input.missionCompleted30d, 4, 'count'),
      contentCreationFrequency: signal('content_creation_frequency', 'Content creation frequency', input.contentGenerated30d, 4, 'count'),
      executionConsistency: signal('execution_consistency', 'Execution consistency', executionConsistency(input), 80, 'percent'),
      aiCooInteractionFrequency: signal('ai_coo_interaction_frequency', 'AI COO interaction frequency', input.aiCooInteractions30d, 4, 'count'),
    },
    momentum: {
      missionsCompleted: input.missionCompleted30d,
      contentGenerated: input.contentGenerated30d,
      leadMagnetsCreated: input.leadMagnetsCreated30d,
      funnelsLaunched: input.funnelsLaunched30d,
      winsAchieved: input.winsAchieved30d,
      recentWins: input.recentWins.slice(0, 5),
    },
    reEngagement: reEngagementFor({ risk: retentionRisk, state: retentionState, daysInactive: inactiveDays }),
    kpis: {
      sevenDayRetention: input.activeDays30d >= 2,
      fourteenDayRetention: input.activeDays30d >= 4,
      thirtyDayRetention: input.activeDays30d >= 8,
      missionCompletionRate: missionCompletionRate(input),
      subscriptionRetention: retentionRisk === 'critical' || retentionRisk === 'high' ? 'at_risk' : 'healthy',
    },
  };
}
