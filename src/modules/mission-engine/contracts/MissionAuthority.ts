export type MissionAuthorityStatus =
  | 'locked'
  | 'available'
  | 'active'
  | 'completed'
  | 'blocked';

export type MissionAuthorityDefinition = {
  id: string;
  title: string;
  description: string;
  expectedOutcome: string;
  estimatedMinutes: number;
  status: MissionAuthorityStatus;
  priority: number;
  unlockConditions: string[];
  completionConditions: string[];
  nextMissionId?: string;
  route: string;
};

export type MissionProgressPathItem = {
  id: string;
  step: number;
  label: string;
  status: 'completed' | 'current' | 'locked';
};

export type MissionAuthoritySnapshot = {
  source: string;
  scope: 'user';
  confidence: 'confirmed' | 'derived' | 'fallback';
  fallback: string | 'none';
  currentJourney: {
    type: string;
    title: string;
    reason: string;
  };
  currentMission: MissionAuthorityDefinition;
  nextMission: MissionAuthorityDefinition | null;
  progress: {
    completionPercentage: number;
    completedMissions: number;
    totalMissions: number;
    nextMilestone: string;
    progressPath: MissionProgressPathItem[];
  };
  estimatedCompletion: {
    minutes: number;
    label: string;
  };
};
