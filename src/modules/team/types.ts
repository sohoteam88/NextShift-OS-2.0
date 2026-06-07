export type TeamMemberStatus = 'active' | 'pending' | 'suspended' | string;

export type TeamMemberBase = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  status: TeamMemberStatus;
  avatar_url: string | null;
  joined_at: string;
  lead_count: number;
  conversion_count: number;
  content_count: number;
  daily_action_streak: number;
  training_completed: number;
  training_total: number;
  last_active_at: string | null;
};

export type TeamMemberNode = TeamMemberBase & {
  children: TeamMemberNode[];
};

export type TeamMemberRow = TeamMemberBase & {
  direct_children_count: number;
};

export type TeamSummary = {
  totalMembers: number;
  activeMembers: number;
  totalLeads: number;
  totalConversions: number;
};

export type TeamViewMode = 'tree' | 'list';

export type LeaderDashboardSummary = {
  totalMembers: number;
  activeMembers: number;
  pendingApprovals: number;
  totalLeads: number;
  totalConversions: number;
  teamConversionRate: number;
};

export type LeaderDashboardMemberPerformance = {
  id: string;
  name: string;
  avatar_url: string | null;
  phone: string | null;
  role: string;
  leads_30d: number;
  conversions_30d: number;
  content_30d: number;
  action_streak: number;
  training_pct: number;
  last_active: string | null;
  status_flag: 'active' | 'cooling' | 'inactive';
  status: string;
};

export type LeaderDashboardAlert =
  | {
      type: 'inactive';
      member: { id: string; name: string };
      days_inactive: number;
    }
  | {
      type: 'stalled_training';
      member: { id: string; name: string };
      stuck_at_module: string;
    }
  | {
      type: 'no_content';
      member: { id: string; name: string };
      days_without_content: number;
    }
  | {
      type: 'pending_approval';
      member: { id: string; name: string };
      waiting_since: string;
    };

export type LeaderDashboardTrendPoint = {
  week: string;
  count: number;
};

export type LeaderDashboardWeeklyTrend = {
  leads: LeaderDashboardTrendPoint[];
  conversions: LeaderDashboardTrendPoint[];
  content: LeaderDashboardTrendPoint[];
};

export type TeamTopPerformer = {
  id: string;
  name: string;
  avatar_url: string | null;
  metric: string;
  value: number;
};

export type LeaderDashboardData = {
  summary: LeaderDashboardSummary;
  memberPerformance: LeaderDashboardMemberPerformance[];
  alerts: LeaderDashboardAlert[];
  weeklyTrend: LeaderDashboardWeeklyTrend;
  topPerformers: TeamTopPerformer[];
};
