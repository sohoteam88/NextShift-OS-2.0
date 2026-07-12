export type BusinessMemoryEventType =
  | 'MISSION_COMPLETED'
  | 'MISSION_BLOCKED'
  | 'MISSION_ABANDONED'
  | 'RECOMMENDATION_ISSUED'
  | 'RECOMMENDATION_ACCEPTED'
  | 'RECOMMENDATION_IGNORED'
  | 'READINESS_CHANGED'
  | 'AUTHORITY_CHANGED'
  | 'COO_DECISION_MADE'
  | 'DISCUSSION_STARTED'
  | 'DISCUSSION_TURN_COMPLETED'
  | 'DISCUSSION_ABANDONED';

export type BusinessMemoryEvent = {
  id: string;
  type: BusinessMemoryEventType;
  tenantId: string;
  userId: string;
  occurredAt: string;
  title: string;
  summary: string;
  referenceId?: string;
  metadata?: Record<string, unknown>;
};

export type BusinessMemoryActivity = {
  type: BusinessMemoryEventType | 'MILESTONE_COMPLETED' | 'USER_ACTIVITY';
  title: string;
  summary: string;
  occurredAt: string;
  referenceId?: string;
};

export type ExecutionPattern = {
  activityLevel: 'quiet' | 'active' | 'high_momentum';
  completionVelocity: 'none' | 'slow' | 'steady' | 'fast';
  recommendationResponse: 'unknown' | 'accepting' | 'ignoring' | 'mixed';
  consistency: 'low' | 'medium' | 'high';
};

export type RecommendationMemory = {
  recentlyIssuedIds: string[];
  acceptedIds: string[];
  ignoredIds: string[];
};

export type BusinessContextProjection = {
  recentActivities: BusinessMemoryActivity[];
  currentFocus: string;
  blockedAreas: string[];
  completedMilestones: string[];
  executionPattern: ExecutionPattern;
  recommendedFocus: string;
  recommendationMemory: RecommendationMemory;
};
