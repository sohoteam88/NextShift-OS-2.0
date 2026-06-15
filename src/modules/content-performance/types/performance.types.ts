export interface ContentKPIs {
  views: number;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  leads: number;
  appointments: number;
  revenue: number;
}

export interface ContentPerformance {
  contentId: string;
  title: string;
  platform: string;
  pillar: string;
  publishedAt: string;
  predictedScore: number;
  actualScore: number;
  kpis: ContentKPIs;
  performanceScore: number;
}

export interface BenchmarkComparison {
  category: string;      // pillar, platform, format, ctaType
  groups: BenchmarkGroup[];
}

export interface BenchmarkGroup {
  label: string;
  avgReach: number;
  avgEngagement: number;
  avgLeads: number;
  avgPerformance: number;
  count: number;
}

export interface ContentRecommendation {
  action: string;
  reason: string;
  expectedImpact: string;
  suggestedPillar?: string;
  suggestedPlatform?: string;
}

export type PerformanceLevel = 'locked' | 'basic' | 'lead' | 'advanced';
