export type AnalyticsPeriod = '7d' | '30d' | '90d';
export type AnalyticsScopeRole = 'member' | 'leader' | 'operator';

export type AnalyticsMetric = {
  label: string;
  value: number | string;
  hint?: string;
};

export type AnalyticsTrendPoint = {
  label: string;
  [key: string]: string | number;
};

export type AnalyticsDistributionPoint = {
  name: string;
  value: number;
  color?: string;
};

export type AnalyticsFunnelStep = {
  name: string;
  value: number;
  rate: number;
  color?: string;
};

export type AnalyticsHeatmapCell = {
  dayIndex: number;
  blockIndex: number;
  value: number;
};

export type AnalyticsMemberStat = {
  id: string;
  name: string;
  role: string;
  status: string;
  leads: number;
  conversions: number;
  content: number;
  actions: number;
  aiUsage: number;
  score: number;
  avgResponseMinutes: number | null;
  retention: boolean;
  lastActive: string | null;
  createdAt: string;
};

export type AnalyticsFunnelPerformance = {
  id: string;
  title: string;
  status: string;
  views: number;
  conversions: number;
  conversionRate: number;
};

export type AnalyticsSummary = {
  totalUsers: number;
  activeMembers: number;
  newMembers: number;
  totalLeads: number;
  totalConversions: number;
  conversionRate: number;
  contentCount: number;
  aiUsageCount: number;
  funnelViews: number;
  funnelConversions: number;
  actionCompletionRate: number;
  memberRetentionRate: number;
  avgResponseMinutes: number | null;
};

export type AnalyticsDashboardData = {
  view: AnalyticsScopeRole;
  period: AnalyticsPeriod;
  range: { start: string; end: string };
  summary: AnalyticsSummary;
  stageDistribution: AnalyticsDistributionPoint[];
  leadTrend: AnalyticsTrendPoint[];
  conversionTrend: AnalyticsTrendPoint[];
  conversionFunnel: AnalyticsFunnelStep[];
  contentByPlatform: AnalyticsDistributionPoint[];
  aiUsageTrend: AnalyticsTrendPoint[];
  funnelPerformance: AnalyticsFunnelPerformance[];
  actionCompletionTrend: AnalyticsTrendPoint[];
  teamGrowthTrend: AnalyticsTrendPoint[];
  heatmap: AnalyticsHeatmapCell[];
  memberStats: AnalyticsMemberStat[];
  topMembers: AnalyticsMemberStat[];
};
