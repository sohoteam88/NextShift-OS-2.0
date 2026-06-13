export interface BusinessHealthScore { overallScore: number; level: 'low'|'medium'|'high'; brandHealth: number; contentHealth: number; trafficHealth: number; funnelHealth: number; salesHealth: number; crmHealth: number; recommendations: string[]; }
export interface KPIOverview { totalPosts: number; totalVideos: number; totalLeads: number; totalConversions: number; totalRevenue: number; conversionRate: number; leadResponseRate: number; }
export interface AIInsight { id: string; insight: string; impact: 'high'|'medium'|'low'; category: string; action: string; }
export interface NextBestAction { id: string; priority: number; action: string; reason: string; impact: string; }
export interface Anomaly { id: string; metric: string; change: string; direction: 'up'|'down'; severity: 'warning'|'critical'; alert: string; }
export interface Benchmark { level: 'starter'|'growth'|'scale'; requirements: string[]; progress: number; }
export interface AnalyticsCenter { health: BusinessHealthScore; kpi: KPIOverview; insights: AIInsight[]; nextActions: NextBestAction[]; anomalies: Anomaly[]; benchmark: Benchmark; contentBreakdown: Record<string,number>; funnelMetrics: { views: number; conversions: number; rate: number }; }
