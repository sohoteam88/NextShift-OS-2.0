import type { ReferralSignal, ReferralSource } from '../contracts/ReferralSignal';

export interface ReferralSignalInput {
  userId: string;
  tenantId: string;
  createdInvites: number;
  activeInvites: number;
  usedInvites: number;
  expiredInvites: number;
  referralLeadCount: number;
  referralMemberCount: number;
  generatedAt: string;
}

function referralSources(input: ReferralSignalInput): ReferralSource[] {
  const sources: ReferralSource[] = [];
  if (input.createdInvites > 0) sources.push('invite_link');
  if (input.referralMemberCount > 0) sources.push('member_invite');
  if (input.referralLeadCount > 0) sources.push('customer_referral');
  return sources.length > 0 ? sources : ['unknown'];
}

function referralScore(input: ReferralSignalInput): number {
  const inviteScore = Math.min(input.createdInvites * 10, 30);
  const usedScore = Math.min(input.usedInvites * 20, 40);
  const leadScore = Math.min(input.referralLeadCount * 10, 20);
  const memberScore = Math.min(input.referralMemberCount * 10, 10);
  return Math.min(inviteScore + usedScore + leadScore + memberScore, 100);
}

export function adaptReferralSignals(input: ReferralSignalInput): ReferralSignal[] {
  const score = referralScore(input);

  return [{
    source: 'GrowthLoop.ReferralSignalAdapter',
    scope: 'user',
    confidence: score > 0 ? 'derived' : 'fallback',
    fallback: score > 0 ? 'none' : 'no_referral_signals_found',

    id: `growth-referral-${input.userId}`,
    domain: 'referral',
    status: score === 0 ? 'missing' : input.usedInvites > 0 ? 'active' : 'ready',
    score,
    summary: `${input.createdInvites} invites created, ${input.usedInvites} used, ${input.referralMemberCount} referred members.`,
    metrics: [
      { key: 'created_invites', label: 'Created invites', value: input.createdInvites, unit: 'count' },
      { key: 'active_invites', label: 'Active invites', value: input.activeInvites, unit: 'count' },
      { key: 'used_invites', label: 'Used invites', value: input.usedInvites, unit: 'count' },
      { key: 'referral_leads', label: 'Referral leads', value: input.referralLeadCount, unit: 'count' },
      { key: 'referral_members', label: 'Referral members', value: input.referralMemberCount, unit: 'count' },
    ],
    evidence: [
      {
        source: 'InviteCode/User/Lead read models',
        description: 'Read-only referral facts aggregated from invites, sponsored users, and referral-sourced leads.',
        observedAt: input.generatedAt,
      },
    ],
    recommendations: input.createdInvites > 0 ? [] : [{
      id: 'growth-referral-create-invite-path',
      title: 'Prepare a referral path',
      summary: 'Create an invite/referral path before measuring referral conversion.',
      priority: 'medium',
      route: '/team/growth',
      owner: 'growth-loop',
    }],
    generatedAt: input.generatedAt,
    sources: referralSources(input),
    invites: {
      created: input.createdInvites,
      active: input.activeInvites,
      used: input.usedInvites,
      expired: input.expiredInvites,
    },
    referralLeadCount: input.referralLeadCount,
    referralMemberCount: input.referralMemberCount,
    conversionRate: input.createdInvites > 0 ? Math.round((input.usedInvites / input.createdInvites) * 100) : undefined,
  }];
}
