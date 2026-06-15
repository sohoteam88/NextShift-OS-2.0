// Achievement System V1 — lightweight gamification

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  condition: (completedMilestones: string[]) => boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'brand_explorer', title: 'Brand Explorer', description: 'Completed your first brand milestone.',
    icon: '🧭', condition: (m) => m.includes('brand_interview_complete'),
  },
  {
    id: 'brand_architect', title: 'Brand Architect', description: 'Built your complete brand identity.',
    icon: '🏗️', condition: (m) => m.includes('brand_dna_complete'),
  },
  {
    id: 'content_creator', title: 'Content Creator', description: 'Published your first piece of content.',
    icon: '✍️', condition: (m) => m.includes('first_content_published'),
  },
  {
    id: 'lead_generator', title: 'Lead Generator', description: 'Captured your first lead.',
    icon: '🧲', condition: (m) => m.includes('first_lead_generated'),
  },
  {
    id: 'customer_closer', title: 'Customer Closer', description: 'Closed your first customer.',
    icon: '🤝', condition: (m) => m.includes('first_customer_acquired'),
  },
  {
    id: 'team_builder', title: 'Team Builder', description: 'Brought in your first team member.',
    icon: '👥', condition: (m) => m.includes('first_team_member'),
  },
  {
    id: 'business_leader', title: 'Business Leader', description: 'Reached Leader level.',
    icon: '🚀', condition: (m) => m.length >= 10,
  },
];

const previouslyUnlocked = new Set<string>();

export function checkNewAchievements(completedMilestones: string[]): AchievementDef[] {
  const newAchievements = ACHIEVEMENTS.filter(a => {
    if (previouslyUnlocked.has(a.id)) return false;
    const unlocked = a.condition(completedMilestones);
    if (unlocked) previouslyUnlocked.add(a.id);
    return unlocked;
  });
  return newAchievements;
}

export function getAllAchievements(completedMilestones: string[]): { unlocked: AchievementDef[]; locked: AchievementDef[] } {
  const unlocked = ACHIEVEMENTS.filter(a => a.condition(completedMilestones));
  const locked = ACHIEVEMENTS.filter(a => !a.condition(completedMilestones));
  return { unlocked, locked };
}
