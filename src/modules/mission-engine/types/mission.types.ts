// Mission Engine types — mission-driven operating system

export type MissionStage =
  | 'brand_foundation'
  | 'content_creation'
  | 'lead_generation'
  | 'customer_acquisition'
  | 'system_building'
  | 'team_scaling';

export interface MissionTask {
  key: string;
  label: string;
  route: string;
  completed: boolean;
}

export interface Mission {
  id: string;
  stage: MissionStage;
  title: string;
  description: string;
  objective: string;
  tasks: MissionTask[];
  rewards: string[];
  estimatedTime: string;
  completed: boolean;
  nextMission?: string;
}

export interface MissionReward {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
}
