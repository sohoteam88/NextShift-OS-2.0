import type { GrowthSignal } from './GrowthSignal';

export type ReferralSource =
  | 'invite_link'
  | 'member_invite'
  | 'customer_referral'
  | 'team_referral'
  | 'unknown';

export interface ReferralInviteSummary {
  created: number;
  active: number;
  used: number;
  expired: number;
}

export interface ReferralSignal extends GrowthSignal {
  domain: 'referral';
  sources: ReferralSource[];
  invites: ReferralInviteSummary;
  referralLeadCount: number;
  referralMemberCount: number;
  conversionRate?: number;
}
