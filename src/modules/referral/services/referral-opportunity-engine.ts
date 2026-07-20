import type { InterviewAuthorityBusinessMode } from '@/modules/interview-authority/contracts/InterviewAuthorityProjection';
import type { ReferralOpportunity, ReferralOpportunityType, ReferralProjection } from '../contracts/ReferralProjection';
import type { ReferralFacts } from './referral-facts';

type OpportunityDefinition = {
  type: ReferralOpportunityType;
  title: string;
  route: string;
  expectedOutcome: string;
};

const CREATOR_OPPORTUNITIES: OpportunityDefinition[] = [
  { type: 'share_success_story', title: '分享成功故事', route: '/content-engine', expectedOutcome: 'Turn recent wins into referral-friendly authority content.' },
  { type: 'case_study', title: '制作案例研究', route: '/content-engine', expectedOutcome: 'Create a proof asset that others can share.' },
  { type: 'content_collaboration', title: '发起内容合作', route: '/analytics', expectedOutcome: 'Reach adjacent audiences through collaboration.' },
];

const SERVICE_OPPORTUNITIES: OpportunityDefinition[] = [
  { type: 'invite_friend', title: '邀请一位朋友体验', route: '/ai-workforce', expectedOutcome: 'Introduce one qualified person and track activation.' },
  { type: 'client_referral', title: '请求客户转介绍', route: '/customers', expectedOutcome: 'Ask satisfied clients for qualified referrals.' },
  { type: 'testimonial', title: '收集客户见证', route: '/customers', expectedOutcome: 'Create trust proof from client outcomes.' },
  { type: 'review_request', title: '发送评价请求', route: '/customers', expectedOutcome: 'Increase public trust and conversion confidence.' },
];

const RETAIL_OPPORTUNITIES: OpportunityDefinition[] = [
  { type: 'invite_friend', title: '邀请一位朋友体验', route: '/ai-workforce', expectedOutcome: 'Introduce one qualified person and track activation.' },
  { type: 'customer_referral', title: '启动顾客转介绍', route: '/customers', expectedOutcome: 'Turn happy buyers into referral sources.' },
  { type: 'transformation_story', title: '整理转变故事', route: '/content-engine', expectedOutcome: 'Turn product results into shareable proof.' },
  { type: 'repeat_buyer_referral', title: '邀请复购顾客推荐', route: '/customers', expectedOutcome: 'Ask repeat buyers to introduce similar customers.' },
];

const TEAM_OPPORTUNITIES: OpportunityDefinition[] = [
  { type: 'invite_friend', title: '邀请一位朋友体验', route: '/ai-workforce', expectedOutcome: 'Introduce one qualified person and track activation.' },
  { type: 'recruit_referral', title: '请求招募转介绍', route: '/ai-workforce', expectedOutcome: 'Ask active members for warm recruit referrals.' },
  { type: 'team_success_story', title: '发布团队成功故事', route: '/ai-workforce', expectedOutcome: 'Turn team wins into duplication proof.' },
  { type: 'leadership_referral', title: '邀请领导力推荐', route: '/ai-workforce', expectedOutcome: 'Find high-potential partners through trusted leaders.' },
];

function definitionsFor(mode: InterviewAuthorityBusinessMode) {
  switch (mode) {
    case 'creator':
      return CREATOR_OPPORTUNITIES;
    case 'service':
      return SERVICE_OPPORTUNITIES;
    case 'team_building':
      return TEAM_OPPORTUNITIES;
    case 'hybrid':
      return [...CREATOR_OPPORTUNITIES.slice(0, 1), ...SERVICE_OPPORTUNITIES.slice(0, 2), ...RETAIL_OPPORTUNITIES.slice(0, 1)];
    case 'retail':
    default:
      return RETAIL_OPPORTUNITIES;
  }
}

function priorityFor(readiness: ReferralProjection['referralReadiness'], index: number): ReferralOpportunity['priority'] {
  if ((readiness === 'advocate' || readiness === 'champion') && index === 0) return 'high';
  if (readiness === 'ready' && index <= 1) return 'medium';
  return 'low';
}

export function detectReferralOpportunities(
  facts: ReferralFacts,
  readiness: ReferralProjection['referralReadiness'],
): ReferralOpportunity[] {
  return definitionsFor(facts.businessMode).map((definition, index) => ({
    id: `referral_${definition.type}`,
    type: definition.type,
    title: definition.title,
    reason: readiness === 'champion' || readiness === 'advocate'
      ? 'The user has strong value, retention, and recent win signals, so advocacy can be activated now.'
      : readiness === 'ready'
        ? 'The user has enough proof to make a focused referral ask.'
        : 'Prepare this referral path for when value and retention signals are stronger.',
    route: definition.route,
    priority: priorityFor(readiness, index),
    expectedOutcome: definition.expectedOutcome,
    personalizedBy: ['businessMode', 'successState', 'retentionState', 'expansionState', 'region'] as ReferralOpportunity['personalizedBy'],
  }));
}

export function nextReferralMilestoneFor(
  facts: ReferralFacts,
  readiness: ReferralProjection['referralReadiness'],
  opportunity: ReferralOpportunity | null,
): ReferralProjection['nextReferralMilestone'] {
  if (readiness === 'not_ready' || readiness === 'potential') {
    return {
      title: 'Build referral readiness',
      target: 'Reach referral readiness: ready',
      route: facts.valueProjection.recommendedValueAction.route,
    };
  }

  if (facts.referralInvitesCreated === 0) {
    return {
      title: 'Create the first referral path',
      target: 'Referral invites created: 1',
      route: '/ai-workforce',
    };
  }

  return {
    title: opportunity?.title ?? 'Activate the next referral ask',
    target: facts.activatedReferrals > 0 ? `Activated referrals: ${facts.activatedReferrals + 1}` : 'Activated referrals: 1',
    route: opportunity?.route ?? '/customers',
  };
}
