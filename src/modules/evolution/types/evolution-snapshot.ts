export type EvolutionLevel =
  | 'explorer'
  | 'builder'
  | 'operator'
  | 'leader';

export type EvolutionModule =
  | 'dashboard'
  | 'journey'
  | 'brand-builder'
  | 'content-engine'
  | 'lead-engine'
  | 'crm'
  | 'sales'
  | 'team';

export interface EvolutionSnapshot {
  level: EvolutionLevel;

  progressPercentage: number;

  currentStage: string;

  nextLevel: Exclude<EvolutionLevel, 'explorer'> | null;

  unlockedModules: EvolutionModule[];

  completedMissions: number;

  totalMissions: number;
}
