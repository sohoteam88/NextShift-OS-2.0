// User Evolution Engine — shared types (ADR-011)

export type UserLevel = 'explorer' | 'builder' | 'operator' | 'leader';

export interface EvolutionMilestone {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: Date;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
}

export interface UserEvolutionState {
  level: UserLevel;
  completedMilestones: string[];
  unlockedModules: string[];
  achievements: Achievement[];
  nextMilestone: string;
  progressPercentage: number;
}

export type AICoachStyle = 'teacher' | 'content_strategist' | 'sales_coach' | 'business_mentor';

export interface AICoachPersona {
  style: AICoachStyle;
  focus: string[];
  tone: string;
}
