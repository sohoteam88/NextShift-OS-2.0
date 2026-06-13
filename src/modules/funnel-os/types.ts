import type { FunnelType } from '@/modules/funnel-context/types';

export interface FunnelProgress {
  funnelType: FunnelType;
  progress: number; // 0-100
  currentStage: string;
  nextStage: string;
  bottleneck: string | null;
  bottleneckFix: string | null;
}

export interface FunnelMilestone {
  id: string; label: string; completed: boolean;
}

export interface FunnelGoal {
  funnelType: FunnelType;
  goal: string;
  target: number; current: number;
  progress: number;
}

export interface FunnelHealth {
  traffic: number; content: number; conversion: number;
  followUp: number; pipeline: number;
  overallScore: number;
}

export interface FunnelNextAction {
  action: string; expectedImpact: string; route?: string;
}

export interface FunnelKPI {
  label: string; value: string; target?: string;
}

export const RETAIL_MILESTONES: FunnelMilestone[] = [
  { id: 'first_content', label: 'First Content', completed: false },
  { id: 'first_video', label: 'First Video', completed: false },
  { id: 'first_lead', label: 'First Lead', completed: false },
  { id: 'first_appointment', label: 'First Appointment', completed: false },
  { id: 'first_customer', label: 'First Customer', completed: false },
  { id: 'first_repeat', label: 'First Repeat Customer', completed: false },
];

export const RECRUITMENT_MILESTONES: FunnelMilestone[] = [
  { id: 'first_content', label: 'First Content', completed: false },
  { id: 'first_webinar', label: 'First Webinar', completed: false },
  { id: 'first_lead', label: 'First Lead', completed: false },
  { id: 'first_call', label: 'First Strategy Call', completed: false },
  { id: 'first_member', label: 'First Member', completed: false },
  { id: 'first_builder', label: 'First Builder', completed: false },
];

export const UPGRADE_MILESTONES: FunnelMilestone[] = [
  { id: 'first_webinar_invite', label: 'First Webinar Invite', completed: false },
  { id: 'first_upgrade', label: 'First Member Upgrade', completed: false },
  { id: 'first_builder', label: 'First Builder', completed: false },
];

export const MILESTONES: Record<FunnelType, FunnelMilestone[]> = {
  retail: RETAIL_MILESTONES, recruitment: RECRUITMENT_MILESTONES, upgrade: UPGRADE_MILESTONES,
};

export const FUNNEL_GOALS: Record<FunnelType, string[]> = {
  retail: ['First Customer', '10 Customers', '50 Customers'],
  recruitment: ['First Member', '10 Members', '50 Members'],
  upgrade: ['First Upgrade', '10 Upgrades'],
};
