import type { ActivationMilestone, ActivationSignal } from '../contracts/ActivationSignal';

export interface ActivationSignalInput {
  userId: string;
  tenantId: string;
  onboardingCompleted: boolean;
  currentStageId?: string;
  completedChecks: string[];
  completedMissionCount: number;
  totalMissionCount: number;
  generatedAt: string;
}

function activationMilestones(input: ActivationSignalInput): ActivationMilestone[] {
  return [
    {
      id: 'onboarding',
      label: 'Onboarding',
      status: input.onboardingCompleted ? 'completed' : 'in_progress',
      route: '/dashboard',
    },
    {
      id: 'journey_progress',
      label: 'Journey progress',
      status: input.completedChecks.length > 0 ? 'in_progress' : 'not_started',
      route: '/journey',
    },
    {
      id: 'mission_completion',
      label: 'Mission completion',
      status: input.completedMissionCount > 0 ? 'in_progress' : 'not_started',
      route: '/dashboard',
    },
  ];
}

function progressPercent(input: ActivationSignalInput): number {
  const onboarding = input.onboardingCompleted ? 30 : 0;
  const checks = Math.min(input.completedChecks.length * 10, 40);
  const mission = input.totalMissionCount > 0
    ? Math.round((input.completedMissionCount / input.totalMissionCount) * 30)
    : 0;
  return Math.min(onboarding + checks + mission, 100);
}

export function adaptActivationSignals(input: ActivationSignalInput): ActivationSignal[] {
  const progress = progressPercent(input);
  const milestones = activationMilestones(input);

  return [{
    source: 'GrowthLoop.ActivationSignalAdapter',
    scope: 'user',
    confidence: progress > 0 ? 'derived' : 'fallback',
    fallback: progress > 0 ? 'none' : 'no_activation_signals_found',

    id: `growth-activation-${input.userId}`,
    domain: 'activation',
    status: progress === 0 ? 'missing' : progress >= 100 ? 'complete' : 'active',
    score: progress,
    summary: `${progress}% activation progress across onboarding, journey checks, and missions.`,
    metrics: [
      { key: 'activation_progress', label: 'Activation progress', value: progress, unit: 'percent', target: 100 },
      { key: 'completed_checks', label: 'Completed checks', value: input.completedChecks.length, unit: 'count' },
      { key: 'completed_missions', label: 'Completed missions', value: input.completedMissionCount, unit: 'count' },
    ],
    evidence: [
      {
        source: 'User/UserProgress/Mission read models',
        description: 'Read-only activation facts aggregated from onboarding, journey progress, and missions.',
        observedAt: input.generatedAt,
      },
    ],
    recommendations: progress >= 100 ? [] : [{
      id: 'growth-activation-next-milestone',
      title: 'Complete the next activation milestone',
      summary: 'Continue the current journey step before escalating to broader growth work.',
      priority: progress === 0 ? 'high' : 'medium',
      route: '/journey',
      owner: 'growth-loop',
    }],
    generatedAt: input.generatedAt,
    currentStageId: input.currentStageId,
    currentStageName: input.currentStageId,
    progressPercent: progress,
    milestones,
    nextMilestone: milestones.find((milestone) => milestone.status !== 'completed'),
  }];
}
