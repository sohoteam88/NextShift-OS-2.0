import type { GrowthSignal } from './GrowthSignal';

export type RetentionSegment =
  | 'new_leads'
  | 'active_leads'
  | 'overdue_followup'
  | 'customers'
  | 'inactive_customers'
  | 'team_members';

export interface RetentionFollowupWindow {
  overdue: number;
  dueToday: number;
  upcoming: number;
}

export interface RetentionSignal extends GrowthSignal {
  domain: 'retention';
  segments: RetentionSegment[];
  followups: RetentionFollowupWindow;
  atRiskCount: number;
  retainedCount: number;
  retentionRate?: number;
}
