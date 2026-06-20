export type MissionAuthorityStatus =
  | 'locked'
  | 'available'
  | 'active'
  | 'completed'
  | 'blocked';

export type MissionBusinessStage =
  | 'BRAND_FOUNDATION'
  | 'BRAND_POSITIONING'
  | 'CONTENT_SYSTEM'
  | 'LEAD_MAGNET'
  | 'FUNNEL'
  | 'LEAD_GENERATION'
  | 'SALES'
  | 'TEAM_BUILDING';

export type MissionBottleneck =
  | 'NO_BRAND'
  | 'NO_POSITIONING'
  | 'NO_CONTENT'
  | 'NO_LEAD_MAGNET'
  | 'NO_FUNNEL'
  | 'NO_TRAFFIC'
  | 'NO_LEADS'
  | 'NO_APPOINTMENTS'
  | 'NO_CUSTOMERS'
  | 'NO_TEAM';

export type MissionType =
  | 'BRAND'
  | 'POSITIONING'
  | 'CONTENT'
  | 'LEAD_MAGNET'
  | 'FUNNEL'
  | 'TRAFFIC'
  | 'CUSTOMERS'
  | 'TEAM';

export type MissionLifecycleStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'SKIPPED'
  | 'FAILED';

export type DashboardPriority = 'Critical' | 'High' | 'Normal';

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

export type MissionExplainability = {
  completed: string[];
  currentGap: MissionBottleneck;
  reasoning: string;
  expectedOutcome: string;
};

export type MissionPriorityAction = {
  missionType: MissionType;
  title: string;
  route: string;
  priority: DashboardPriority;
};

export interface AICommandCenter {
  currentStage: MissionBusinessStage;
  missionTitle: string;
  missionDescription: string;
  reasoning: string;
  expectedOutcome: string;
  estimatedTime: string;
  route: string;
  priority: DashboardPriority;
}

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
  businessStage: MissionBusinessStage;
  bottleneck: MissionBottleneck;
  currentMission: MissionAuthorityDefinition;
  nextMission: MissionAuthorityDefinition | null;
  priorityAction: MissionPriorityAction;
  explainability: MissionExplainability;
  dashboardCommandCenter: AICommandCenter;
  lifecycle: MissionLifecycleStatus;
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
