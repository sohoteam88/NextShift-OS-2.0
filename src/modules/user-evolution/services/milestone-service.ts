// Milestone Engine — milestone tracking and progress calculation

export const ALL_MILESTONES = [
  // Explorer
  { id: 'brand_interview_complete', title: 'Brand Interview Complete', level: 'explorer' as const },
  { id: 'brand_dna_complete', title: 'Brand DNA Complete', level: 'explorer' as const },
  { id: 'social_setup_complete', title: 'Social Setup Complete', level: 'explorer' as const },
  // Builder
  { id: 'first_content_published', title: 'First Content Published', level: 'builder' as const },
  { id: 'three_contents_published', title: '3 Content Pieces Published', level: 'builder' as const },
  { id: 'first_lead_generated', title: 'First Lead Generated', level: 'builder' as const },
  // Operator
  { id: 'first_customer_acquired', title: 'First Customer Acquired', level: 'operator' as const },
  { id: 'crm_setup_complete', title: 'CRM Setup Complete', level: 'operator' as const },
  { id: 'followup_system_active', title: 'Follow-Up System Active', level: 'operator' as const },
  // Leader
  { id: 'first_team_member', title: 'First Team Member', level: 'leader' as const },
  { id: 'automation_enabled', title: 'Automation Enabled', level: 'leader' as const },
  { id: 'team_dashboard_active', title: 'Team Dashboard Active', level: 'leader' as const },
];

const TOTAL = ALL_MILESTONES.length;

export function calculateProgress(completedIds: string[]): number {
  return Math.round((completedIds.length / TOTAL) * 100);
}

export function getNextMilestone(completedIds: string[]): string {
  return ALL_MILESTONES.find(m => !completedIds.includes(m.id))?.id ?? 'brand_interview_complete';
}

export function getMilestonesForLevel(level: string): string[] {
  return ALL_MILESTONES.filter(m => m.level === level).map(m => m.id);
}
