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
  | 'NO_AUDIENCE'
  | 'NO_LEAD_MAGNET'
  | 'NO_FUNNEL'
  | 'NO_TRAFFIC'
  | 'NO_LEADS'
  | 'NO_CONVERSION'
  | 'NO_CUSTOMERS'
  | 'NO_RETENTION'
  | 'BUSINESS_HEALTHY'
  | 'NO_SYSTEM'
  | 'NO_TEAM';

export type BottleneckSeverity = 'Critical' | 'High' | 'Medium' | 'None';

export type BottleneckResult = {
  bottleneck: MissionBottleneck;
  confidence: number;
  evidence: string[];
  severity: BottleneckSeverity;
  explainability: string;
};

export type MissionType =
  | 'BRAND'
  | 'POSITIONING'
  | 'CONTENT'
  | 'LEAD_MAGNET'
  | 'FUNNEL'
  | 'TRAFFIC'
  | 'WEBINAR'
  | 'CUSTOMERS'
  | 'RETENTION'
  | 'OPTIMIZATION'
  | 'TEAM'
  | 'SYSTEM';

export type MissionLifecycleStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'VERIFYING'
  | 'COMPLETED'
  | 'BLOCKED'
  | 'SKIPPED'
  | 'FAILED';

export type DashboardPriority = 'Critical' | 'High' | 'Normal';

export type PriorityCategory =
  | 'FOUNDATION'
  | 'CONTENT'
  | 'LEADS'
  | 'CONVERSION'
  | 'RETENTION'
  | 'SYSTEM'
  | 'SCALE'
  | 'OPTIMIZATION';

export type PriorityResult = {
  priorityAction: string;
  priorityReason: string;
  expectedImpact: string;
  urgency: DashboardPriority;
  confidence: number;
  category: PriorityCategory;
  missionType: MissionType;
  route: string;
  ctaLabel: string;
  dedup?: {
    applied: boolean;
    action: string;
    baseScore: number;
    penalty: number;
    finalScore: number;
    reason: string;
  };
};

export type ExplainabilityResult = {
  whyThis: string;
  whyNow: string;
  whyNotOthers: string;
  expectedOutcome: string;
  expectedRisk: string;
  nextMilestone: string;
  locale: ExplainabilityLocale;
  source: 'ExplainabilityEngine';
};

export type ExplainabilityLocale = 'en' | 'zh' | 'ms';

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
  locale: ExplainabilityLocale;
  source: 'ExplainabilityEngine';
  completed: string[];
  currentGap: MissionBottleneck;
  reasoning: string;
  decisionReason: string;
  whyThis: string;
  whyNow: string;
  whyNotOthers: string;
  expectedOutcome: string;
  expectedRisk: string;
  nextMilestone: string;
  evidence: string[];
  severity: BottleneckSeverity;
  confidence: number;
};

export type MissionPriorityAction = {
  missionType: MissionType;
  title: string;
  route: string;
  ctaLabel: string;
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
  ctaLabel: string;
  decisionReason: string;
  priority: DashboardPriority;
}

export type MissionProgressPathItem = {
  id: string;
  step: number;
  label: string;
  status: 'completed' | 'current' | 'locked';
};

export type MissionStep = {
  id: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  required: boolean;
};

export type MissionPlan = {
  id: string;
  objective: string;
  description: string;
  steps: MissionStep[];
  estimatedTime: number;
  successCriteria: string[];
  completionChecks: string[];
  route: string;
  missionType: MissionType;
  nextMilestone: string;
};

export type MissionCompletionValidation = {
  completed: boolean;
  completionPercentage: number;
  completionChecks: string[];
  passedChecks: string[];
  failedChecks: string[];
  missingChecks: string[];
  nextRequiredCheck: string | null;
  verificationStatus: 'VERIFIED' | 'VERIFYING' | 'BLOCKED';
  verificationSource: 'signal' | 'unavailable' | 'manual';
  verifiedAt: string;
  source: 'MissionCompletionVerifier' | 'MissionGeneratorV2';
};

export type MissionCompletionResult = MissionCompletionValidation;

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
  bottleneckResult: BottleneckResult;
  bottleneckSignals?: Record<string, unknown> | null;
  priorityResult: PriorityResult;
  currentMission: MissionAuthorityDefinition;
  nextMission: MissionAuthorityDefinition | null;
  priorityAction: MissionPriorityAction;
  explainability: MissionExplainability;
  missionPlan: MissionPlan;
  missionCompletion: MissionCompletionValidation;
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
