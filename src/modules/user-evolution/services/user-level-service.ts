// User Evolution Engine — milestone-based automatic level progression
// ADR-011: Users evolve Explorer → Builder → Operator → Leader

export type UserLevel = 'explorer' | 'builder' | 'operator' | 'leader';

export interface UserEvolutionState {
  level: UserLevel;
  completedMilestones: string[];
  unlockedModules: string[];
  nextMilestone: string;
  progressPercentage: number;
}

interface ProgressInput {
  brandInterview?: boolean;
  brandDNA?: boolean;
  socialSetup?: boolean;
  contentCount?: number;
  leadCount?: number;
  customerCount?: number;
  teamMemberCount?: number;
  crmActive?: boolean;
  followUpActive?: boolean;
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
  return keys.filter(k => completed.includes(k)).length;
}

export function getUserLevel(input: ProgressInput = {}): UserEvolutionState {
  const completed: string[] = [];

  if (input.brandInterview) completed.push('brand_interview');
  if (input.brandDNA) completed.push('brand_dna');
  if (input.socialSetup) completed.push('social_setup');
  if ((input.contentCount ?? 0) >= 1) completed.push('first_content');
  if ((input.contentCount ?? 0) >= 3) completed.push('three_content');
  if ((input.leadCount ?? 0) >= 1) completed.push('first_lead');
  if ((input.customerCount ?? 0) >= 1) completed.push('first_customer');
  if (input.crmActive) completed.push('crm_setup');
  if (input.followUpActive) completed.push('follow_up_active');
  if ((input.teamMemberCount ?? 0) >= 1) completed.push('first_team_member');
  if (input.crmActive && input.followUpActive) completed.push('automation_enabled');

  let level: UserLevel = 'explorer';
  if (countCompletion(LEADER_MILESTONES.map(m => m.key), completed) >= LEADER_MILESTONES.length - 1) {
    level = 'leader';
  } else if (countCompletion(OPERATOR_MILESTONES.map(m => m.key), completed) >= OPERATOR_MILESTONES.length - 1) {
    level = 'operator';
  } else if (countCompletion(BUILDER_MILESTONES.map(m => m.key), completed) >= BUILDER_MILESTONES.length - 1) {
    level = 'builder';
  }

  const milestoneMap: Record<UserLevel, typeof EXPLORER_MILESTONES> = {
    explorer: EXPLORER_MILESTONES,
    builder: BUILDER_MILESTONES,
    operator: OPERATOR_MILESTONES,
    leader: LEADER_MILESTONES,
  };

  const currentMilestones = milestoneMap[level];
  const nextMilestone = currentMilestones.find(m => !completed.includes(m.key))?.key ?? 'brand_interview';

  const moduleMap: Record<UserLevel, string[]> = {
    explorer: ['Brand Builder', 'AI Coach', 'Journey'],
    builder: ['Content Engine', 'Lead Magnet Builder', 'Content Analytics'],
    operator: ['CRM', 'Sales Engine', 'Follow-Up System', 'Revenue Dashboard'],
    leader: ['Team Management', 'Automation Engine', 'Advanced Analytics', 'Funnel Intelligence'],
  };

  return {
    level,
    completedMilestones: completed,
    unlockedModules: moduleMap[level],
    nextMilestone,
    progressPercentage: Math.round((completed.length / TOTAL_MILESTONES) * 100),
  };
}
