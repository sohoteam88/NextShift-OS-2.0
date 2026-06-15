// Growth Roadmap Service — 15-step business building path
// Integrates User Evolution + Mission Engine + Journey actions

import type { RoadmapStep, RoadmapMissionGroup, GrowthRoadmapState, RoadmapStepStatus } from '../types/roadmap.types';
import type { UserLevel } from '@/modules/user-evolution/types/evolution.types';
import { ALL_MILESTONES } from '@/modules/user-evolution/services/milestone-service';
import { getUserLevel } from '@/modules/user-evolution/services/user-level-service';
import { getUnlockedModules } from '@/modules/user-evolution/services/unlock-service';

// ─── 15-Step Roadmap Definition ──────────────────────────────────────────────

const STEPS: Omit<RoadmapStep, 'status'>[] = [
  { id: 'brand_interview', stepNumber: 1, title: 'Brand Interview', description: 'Tell AI your story, goals, and audience.', missionId: 'brand_foundation', route: '/brand-builder/step/interview', estimatedTime: '10 min', rewards: ['Brand Positioning', 'Content Direction'] },
  { id: 'brand_dna', stepNumber: 2, title: 'Brand DNA', description: 'Generate your complete brand identity.', missionId: 'brand_foundation', route: '/brand-dna', estimatedTime: '5 min', rewards: ['Brand Identity', 'AI Personalization'] },
  { id: 'social_setup', stepNumber: 3, title: 'Social Setup', description: 'Set up your social media presence.', missionId: 'brand_foundation', route: '/social-setup', estimatedTime: '15 min', rewards: ['Social Profiles', 'Bio + Banner'] },
  { id: 'first_content', stepNumber: 4, title: 'First Content', description: 'Publish your first piece of content.', missionId: 'content_creation', route: '/content-engine', estimatedTime: '10 min', rewards: ['Visibility', 'Audience Growth'] },
  { id: 'content_engine', stepNumber: 8, title: 'Content Engine', description: 'Scale content production with AI.', missionId: 'content_creation', route: '/content-engine', estimatedTime: '20 min', rewards: ['Content Calendar', 'Multi-Platform'] },
  { id: 'first_lead', stepNumber: 5, title: 'First Lead', description: 'Capture your first potential customer.', missionId: 'lead_generation', route: '/lead-magnet', estimatedTime: '15 min', rewards: ['Lead Pipeline', 'Audience List'] },
  { id: 'lead_engine', stepNumber: 9, title: 'Lead Engine', description: 'Build automated lead generation.', missionId: 'lead_generation', route: '/traffic-engine', estimatedTime: '30 min', rewards: ['Automated Leads', 'Traffic System'] },
  { id: 'first_customer', stepNumber: 6, title: 'First Customer', description: 'Convert your first paying customer.', missionId: 'customer_acquisition', route: '/crm', estimatedTime: '30 min', rewards: ['Revenue', 'Case Study', 'Confidence'] },
  { id: 'follow_up_system', stepNumber: 7, title: 'Follow-Up System', description: 'Automate customer follow-ups.', missionId: 'customer_acquisition', route: '/whatsapp-ai', estimatedTime: '20 min', rewards: ['Automation', 'Consistency'] },
  { id: 'sales_engine', stepNumber: 10, title: 'Sales Engine', description: 'Build repeatable sales processes.', missionId: 'customer_acquisition', route: '/crm', estimatedTime: '30 min', rewards: ['Sales Pipeline', 'Revenue System'] },
  { id: 'automation_engine', stepNumber: 11, title: 'Automation Engine', description: 'Automate workflows end-to-end.', missionId: 'system_building', route: '/automation', estimatedTime: '40 min', rewards: ['Scalability', 'Time Freedom'] },
  { id: 'team_building', stepNumber: 12, title: 'Team Building', description: 'Bring in your first team member.', missionId: 'team_scaling', route: '/team', estimatedTime: '60 min', rewards: ['Team Growth', 'Delegation'] },
  { id: 'leadership', stepNumber: 13, title: 'Leadership', description: 'Develop leadership capabilities.', missionId: 'team_scaling', route: '/team', estimatedTime: 'ongoing', rewards: ['Leadership Skills', 'Mentorship'] },
  { id: 'scale', stepNumber: 14, title: 'Scale', description: 'Scale operations and revenue.', missionId: 'team_scaling', route: '/analytics-center', estimatedTime: 'ongoing', rewards: ['Business Growth', 'Market Presence'] },
  { id: 'business_operator', stepNumber: 15, title: 'Business Operator', description: 'Run a self-sustaining business.', missionId: 'team_scaling', route: '/dashboard', estimatedTime: 'ongoing', rewards: ['Full System', 'Financial Freedom'] },
];

const TOTAL = STEPS.length;

// ─── Level-based lock rules ──────────────────────────────────────────────────

const LEVEL_STEP_BOUNDARY: Record<UserLevel, number> = {
  explorer: 3,   // steps 1-3
  builder: 5,     // steps 1-5
  operator: 10,   // steps 1-10
  leader: 15,     // steps 1-15
};

function getLockedReason(step: RoadmapStep, level: UserLevel, completed: string[]): string | null {
  if (step.stepNumber <= LEVEL_STEP_BOUNDARY[level]) return null;
  const prevLevel = step.stepNumber <= 5 ? 'Builder' : step.stepNumber <= 10 ? 'Operator' : 'Leader';
  return `🔒 Unlocks at ${prevLevel} Level`;
}

// ─── Public API ─────────────────────────────────────────────────────────────

export function getGrowthRoadmapState(input: {
  brandInterview?: boolean; brandDNA?: boolean; socialSetup?: boolean;
  leadCount?: number; customerCount?: number; contentCount?: number; teamMemberCount?: number;
  crmActive?: boolean; followUpActive?: boolean;
}): GrowthRoadmapState {
  const levelState = getUserLevel(input);
  const completed = levelState.completedMilestones;
  const completedSet = new Set(completed);

  // Map milestone IDs to step completion
  const milestoneToStep: Record<string, string[]> = {
    brand_interview_complete: ['brand_interview'],
    brand_dna_complete: ['brand_dna'],
    social_setup_complete: ['social_setup'],
    first_content_published: ['first_content'],
    three_contents_published: ['content_engine'],
    first_lead_generated: ['first_lead'],
    first_customer_acquired: ['first_customer'],
    crm_setup_complete: ['sales_engine'],
    followup_system_active: ['follow_up_system'],
    first_team_member: ['team_building'],
    automation_enabled: ['automation_engine'],
    team_dashboard_active: ['leadership'],
  };

  const completedStepIds = new Set<string>();
  for (const [ms, steps] of Object.entries(milestoneToStep)) {
    if (completedSet.has(ms)) steps.forEach(s => completedStepIds.add(s));
  }

  let currentFound = false;
  const steps: RoadmapStep[] = STEPS.map(def => {
    let status: RoadmapStepStatus;
    if (completedStepIds.has(def.id)) {
      status = 'completed';
    } else if (!currentFound) {
      status = 'current';
      currentFound = true;
    } else if (def.stepNumber <= LEVEL_STEP_BOUNDARY[levelState.level]) {
      status = 'unlocked';
    } else {
      status = 'locked';
    }
    return { ...def, status };
  });

  const currentStep = steps.find(s => s.status === 'current')!;
  const nextStep = steps.find(s => s.status === 'unlocked');
  const completedCount = steps.filter(s => s.status === 'completed').length;

  // Group by mission
  const missionMap = new Map<string, RoadmapStep[]>();
  for (const step of steps) {
    if (!missionMap.has(step.missionId)) missionMap.set(step.missionId, []);
    missionMap.get(step.missionId)!.push(step);
  }

  const missionGroups: RoadmapMissionGroup[] = [
    { missionId: 'brand_foundation', title: 'Brand Foundation', description: 'Build your personal brand foundation.' },
    { missionId: 'content_creation', title: 'Content Creation', description: 'Publish your first content.' },
    { missionId: 'lead_generation', title: 'Lead Generation', description: 'Get your first lead.' },
    { missionId: 'customer_acquisition', title: 'Customer Acquisition', description: 'Get your first customer.' },
    { missionId: 'system_building', title: 'System Building', description: 'Create repeatable systems.' },
    { missionId: 'team_scaling', title: 'Team Scaling', description: 'Build beyond yourself.' },
  ].map(m => {
    const groupSteps = missionMap.get(m.missionId) ?? [];
    const completedInGroup = groupSteps.filter(s => s.status === 'completed').length;
    return { ...m, steps: groupSteps, progressPercentage: groupSteps.length > 0 ? Math.round((completedInGroup / groupSteps.length) * 100) : 0, completed: completedInGroup === groupSteps.length };
  });

  return {
    currentStep,
    nextStep,
    steps,
    missionGroups,
    completedSteps: completedCount,
    totalSteps: TOTAL,
    progressPercentage: Math.round((completedCount / TOTAL) * 100),
  };
}

export function getRoadmapStepStatus(stepId: string, input: Parameters<typeof getGrowthRoadmapState>[0]): RoadmapStepStatus {
  const state = getGrowthRoadmapState(input);
  return state.steps.find(s => s.id === stepId)?.status ?? 'locked';
}
