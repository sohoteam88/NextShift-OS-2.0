export type RoadmapStepStatus = 'completed' | 'current' | 'unlocked' | 'locked';

export interface RoadmapStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  missionId: string;
  route: string;
  status: RoadmapStepStatus;
  estimatedTime?: string;
  rewards?: string[];
  requiredMilestones?: string[];
}

export interface RoadmapMissionGroup {
  missionId: string;
  title: string;
  description: string;
  steps: RoadmapStep[];
  progressPercentage: number;
  completed: boolean;
}

export interface GrowthRoadmapState {
  currentStep: RoadmapStep;
  nextStep?: RoadmapStep;
  steps: RoadmapStep[];
  missionGroups: RoadmapMissionGroup[];
  completedSteps: number;
  totalSteps: number;
  progressPercentage: number;
}
