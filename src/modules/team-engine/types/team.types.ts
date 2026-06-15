export type MemberStatus = 'new' | 'onboarding' | 'active' | 'inactive' | 'leader-track' | 'leader';
export type LeaderLevel = 'emerging' | 'team_leader' | 'senior_leader' | 'organization_leader';

export interface MemberRecord {
  id: string; name: string; status: MemberStatus; onboardingProgress: number;
  joinedAt: string; leaderLevel?: LeaderLevel;
}

export interface TeamStats {
  prospects: number; customers: number; members: number;
  activeMembers: number; leaders: number; retention: number; growth: number;
}

export interface OrganizationMetrics {
  totalMembers: number; activeMembers: number; leaders: number;
  retentionRate: number; growthRate: number; duplicationRate: number;
}
