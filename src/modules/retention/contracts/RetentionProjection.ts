export type RetentionState =
  | 'new_user'
  | 'active_user'
  | 'engaged_user'
  | 'at_risk'
  | 'inactive'
  | 'churn_risk';

export type RetentionRisk = 'low' | 'medium' | 'high' | 'critical';

export type RetentionSignal = {
  key: string;
  label: string;
  value: number;
  target: number;
  unit: 'count' | 'days' | 'percent';
};

export type MomentumWin = {
  type: 'mission' | 'content' | 'lead_magnet' | 'funnel' | 'execution' | 'achievement';
  title: string;
  occurredAt: string;
};

export type RetentionProjection = {
  source: 'RetentionEngine';
  scope: 'user';
  confidence: 'confirmed' | 'derived' | 'fallback';
  fallback: string | 'none';
  generatedAt: string;
  retentionScore: number;
  retentionState: RetentionState;
  retentionRisk: RetentionRisk;
  momentumScore: number;
  currentMomentum: string;
  currentStreak: number;
  daysInactive: number;
  inactivityFlag: 'none' | '3_days_inactive' | '7_days_inactive' | '14_days_inactive' | '30_days_inactive';
  signals: {
    loginFrequency: RetentionSignal;
    missionCompletionFrequency: RetentionSignal;
    contentCreationFrequency: RetentionSignal;
    executionConsistency: RetentionSignal;
    aiCooInteractionFrequency: RetentionSignal;
  };
  momentum: {
    missionsCompleted: number;
    contentGenerated: number;
    leadMagnetsCreated: number;
    funnelsLaunched: number;
    winsAchieved: number;
    recentWins: MomentumWin[];
  };
  reEngagement: {
    needed: boolean;
    priority: RetentionRisk;
    title: string;
    reason: string;
    route: string;
  };
  kpis: {
    sevenDayRetention: boolean;
    fourteenDayRetention: boolean;
    thirtyDayRetention: boolean;
    missionCompletionRate: number;
    subscriptionRetention: 'unknown' | 'healthy' | 'at_risk';
  };
};
