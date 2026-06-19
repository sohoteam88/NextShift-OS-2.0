import type { GrowthSignal } from './GrowthSignal';

export type ActivationMilestoneStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'blocked';

export interface ActivationMilestone {
  id: string;
  label: string;
  status: ActivationMilestoneStatus;
  completedAt?: string;
  route?: string;
}

export interface ActivationSignal extends GrowthSignal {
  domain: 'activation';
  currentStageId?: string;
  currentStageName?: string;
  day?: number;
  progressPercent: number;
  milestones: ActivationMilestone[];
  nextMilestone?: ActivationMilestone;
}
