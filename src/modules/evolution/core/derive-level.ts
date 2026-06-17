import type { EvolutionLevel } from '../types/evolution-snapshot';

export interface LevelDerivationInput {
  brandInterview: boolean;
  brandDNA: boolean;
  socialSetup: boolean;
  contentCount: number;
  leadCount: number;
  customerCount: number;
  teamMemberCount: number;
  crmActive: boolean;
  followUpActive: boolean;
}

export interface LevelDerivationResult {
  level: EvolutionLevel;
  progressPercentage: number;
  completedMilestones: string[];
  nextMilestone: string | null;
}

const EXPLORER_MILESTONES = [
  { key: 'brand_interview', label: 'Brand Interview Complete' },
  { key: 'brand_dna', label: 'Brand DNA Complete' },
  { key: 'social_setup', label: 'Social Setup Complete' },
];

const BUILDER_MILESTONES = [
  ...EXPLORER_MILESTONES,
  { key: 'first_content', label: 'First Content Published' },
  { key: 'three_content', label: '3 Content Pieces Published' },
  { key: 'first_lead', label: 'First Lead Captured' },
];

const OPERATOR_MILESTONES = [
  ...BUILDER_MILESTONES,
  { key: 'first_customer', label: 'First Customer' },
  { key: 'crm_setup', label: 'CRM Setup Complete' },
  { key: 'follow_up_active', label: 'Follow-Up Active' },
];

const LEADER_MILESTONES = [
  ...OPERATOR_MILESTONES,
  { key: 'first_team_member', label: 'First Team Member' },
  { key: 'automation_enabled', label: 'Automation Enabled' },
];

const TOTAL_MILESTONES = LEADER_MILESTONES.length;

function countCompletion(keys: string[], completed: string[]): number {
  return keys.filter((key) => completed.includes(key)).length;
}

export function deriveLevel(input: LevelDerivationInput): LevelDerivationResult {
  const completedMilestones: string[] = [];

  if (input.brandInterview) completedMilestones.push('brand_interview');
  if (input.brandDNA) completedMilestones.push('brand_dna');
  if (input.socialSetup) completedMilestones.push('social_setup');
  if ((input.contentCount ?? 0) >= 1) completedMilestones.push('first_content');
  if ((input.contentCount ?? 0) >= 3) completedMilestones.push('three_content');
  if ((input.leadCount ?? 0) >= 1) completedMilestones.push('first_lead');
  if ((input.customerCount ?? 0) >= 1) completedMilestones.push('first_customer');
  if (input.crmActive) completedMilestones.push('crm_setup');
  if (input.followUpActive) completedMilestones.push('follow_up_active');
  if ((input.teamMemberCount ?? 0) >= 1) completedMilestones.push('first_team_member');
  if (input.crmActive && input.followUpActive) completedMilestones.push('automation_enabled');

  let level: EvolutionLevel = 'explorer';
  if (countCompletion(LEADER_MILESTONES.map((milestone) => milestone.key), completedMilestones) >= LEADER_MILESTONES.length - 1) {
    level = 'leader';
  } else if (countCompletion(OPERATOR_MILESTONES.map((milestone) => milestone.key), completedMilestones) >= OPERATOR_MILESTONES.length - 1) {
    level = 'operator';
  } else if (countCompletion(BUILDER_MILESTONES.map((milestone) => milestone.key), completedMilestones) >= BUILDER_MILESTONES.length - 1) {
    level = 'builder';
  }

  const milestoneMap: Record<EvolutionLevel, typeof EXPLORER_MILESTONES> = {
    explorer: EXPLORER_MILESTONES,
    builder: BUILDER_MILESTONES,
    operator: OPERATOR_MILESTONES,
    leader: LEADER_MILESTONES,
  };

  const currentMilestones = milestoneMap[level];
  const nextMilestone = currentMilestones.find((milestone) => !completedMilestones.includes(milestone.key))?.key ?? 'brand_interview';

  return {
    level,
    progressPercentage: Math.round((completedMilestones.length / TOTAL_MILESTONES) * 100),
    completedMilestones,
    nextMilestone,
  };
}
