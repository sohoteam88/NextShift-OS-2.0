// Mission Service — mission-driven operating layer
// Maps user level + milestones to the current mission

import type { Mission, MissionTask } from '../types/mission.types';
import type { UserLevel } from '@/modules/user-evolution/types/evolution.types';

interface MissionInput {
  level: UserLevel;
  brandInterview?: boolean;
  brandDNA?: boolean;
  socialSetup?: boolean;
  hasContent?: boolean;
  hasLead?: boolean;
  hasCustomer?: boolean;
  teamMemberCount?: number;
}

const MISSIONS: Record<string, Omit<Mission, 'tasks' | 'completed'>> = {
  brand_foundation: {
    id: 'brand_foundation', stage: 'brand_foundation',
    title: 'Brand Foundation', description: 'Build your personal brand foundation.',
    objective: 'Establish a clear brand identity that AI can use to create personalized content.',
    rewards: ['Brand Positioning', 'Content Direction', 'AI Personalization'],
    estimatedTime: '15 minutes', nextMission: 'content_creation',
  },
  content_creation: {
    id: 'content_creation', stage: 'content_creation',
    title: 'Content Creation', description: 'Publish your first content.',
    objective: 'Get your first piece of content published and start building visibility.',
    rewards: ['Audience Visibility', 'Lead Readiness'],
    estimatedTime: '10 minutes', nextMission: 'lead_generation',
  },
  lead_generation: {
    id: 'lead_generation', stage: 'lead_generation',
    title: 'Lead Generation', description: 'Get your first lead.',
    objective: 'Create a lead capture system that brings in potential customers.',
    rewards: ['Lead Pipeline', 'Audience List'],
    estimatedTime: '20 minutes', nextMission: 'customer_acquisition',
  },
  customer_acquisition: {
    id: 'customer_acquisition', stage: 'customer_acquisition',
    title: 'Customer Acquisition', description: 'Get your first customer.',
    objective: 'Convert a lead into a paying customer.',
    rewards: ['Revenue', 'Case Study', 'Confidence'],
    estimatedTime: '30 minutes', nextMission: 'system_building',
  },
  system_building: {
    id: 'system_building', stage: 'system_building',
    title: 'System Building', description: 'Create repeatable systems.',
    objective: 'Build automation and workflows that work without you.',
    rewards: ['Scalability', 'Time Freedom'],
    estimatedTime: '40 minutes', nextMission: 'team_scaling',
  },
  team_scaling: {
    id: 'team_scaling', stage: 'team_scaling',
    title: 'Team Scaling', description: 'Build beyond yourself.',
    objective: 'Recruit and lead a team to multiply your impact.',
    rewards: ['Team Growth', 'Business Expansion'],
    estimatedTime: '60 minutes',
  },
};

const TASK_MAP: Record<string, MissionTask[]> = {
  brand_foundation: [
    { key: 'brand_interview', label: 'Brand Interview', route: '/brand-builder/step/interview', completed: false },
    { key: 'brand_dna', label: 'Brand DNA', route: '/brand-dna', completed: false },
    { key: 'social_setup', label: 'Social Setup', route: '/social-setup', completed: false },
  ],
  content_creation: [
    { key: 'first_content', label: 'Content Planning', route: '/content-engine', completed: false },
    { key: 'content_generated', label: 'Content Generation', route: '/content-engine', completed: false },
    { key: 'content_published', label: 'Content Publishing', route: '/content-engine', completed: false },
  ],
  lead_generation: [
    { key: 'lead_magnet', label: 'Lead Magnet', route: '/lead-magnet', completed: false },
    { key: 'landing_page', label: 'Landing Page', route: '/funnel-builder', completed: false },
    { key: 'lead_capture', label: 'Lead Capture', route: '/traffic-engine', completed: false },
  ],
  customer_acquisition: [
    { key: 'crm_setup', label: 'CRM Setup', route: '/crm', completed: false },
    { key: 'follow_up', label: 'Follow-Up', route: '/whatsapp-ai', completed: false },
    { key: 'sales_conversation', label: 'Sales Conversation', route: '/crm', completed: false },
  ],
  system_building: [
    { key: 'automation', label: 'Automation', route: '/automation', completed: false },
    { key: 'workflow', label: 'Workflow', route: '/automation', completed: false },
    { key: 'ai_assistants', label: 'AI Assistants', route: '/ai-workforce', completed: false },
  ],
  team_scaling: [
    { key: 'recruitment', label: 'Recruitment', route: '/team', completed: false },
    { key: 'team_management', label: 'Team Management', route: '/team', completed: false },
    { key: 'leadership', label: 'Leadership', route: '/team', completed: false },
  ],
};

function determineStage(input: MissionInput): Mission['stage'] {
  if (!input.brandInterview || !input.brandDNA || !input.socialSetup) return 'brand_foundation';
  if (!input.hasContent) return 'content_creation';
  if (!input.hasLead) return 'lead_generation';
  if (!input.hasCustomer) return 'customer_acquisition';
  if ((input.teamMemberCount ?? 0) < 1) return 'system_building';
  return 'team_scaling';
}

export function getCurrentMission(input: MissionInput): Mission {
  const stage = determineStage(input);
  const def = MISSIONS[stage];
  const tasks = (TASK_MAP[stage] ?? []).map(t => ({
    ...t,
    completed: input.brandInterview ? (t.key === 'brand_interview') :
               input.brandDNA ? ['brand_interview', 'brand_dna'].includes(t.key) :
               input.socialSetup ? ['brand_interview', 'brand_dna', 'social_setup'].includes(t.key) :
               false,
  }));

  const completedCount = tasks.filter(t => t.completed).length;
  const allComplete = completedCount === tasks.length;

  return {
    ...def,
    tasks,
    completed: allComplete,
  };
}

export function getMissionTasks(stage: Mission['stage']): MissionTask[] {
  return TASK_MAP[stage] ?? [];
}
