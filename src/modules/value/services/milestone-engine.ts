import type { InterviewAuthorityBusinessMode } from '@/modules/interview-authority/contracts/InterviewAuthorityProjection';
import type { ValueMilestone, ValueMilestoneId } from '../contracts/ValueProjection';
import type { OutcomeFacts } from './outcome-tracker';

type MilestoneDefinition = {
  id: ValueMilestoneId;
  label: string;
  route: string;
  achievedAt: (facts: OutcomeFacts) => Date | null;
};

const CREATOR_MILESTONES: MilestoneDefinition[] = [
  { id: 'first_content_published', label: 'First Content Published', route: '/content-engine', achievedAt: (facts) => facts.firstContentPublishedAt },
  { id: 'first_100_views', label: 'First 100 Views', route: '/analytics', achievedAt: (facts) => facts.first100ViewsAt },
  { id: 'first_1000_views', label: 'First 1000 Views', route: '/analytics', achievedAt: (facts) => facts.first1000ViewsAt },
];

const SERVICE_MILESTONES: MilestoneDefinition[] = [
  { id: 'first_lead', label: 'First Lead', route: '/crm', achievedAt: (facts) => facts.firstLeadAt },
  { id: 'first_appointment', label: 'First Appointment', route: '/crm', achievedAt: (facts) => facts.firstAppointmentAt },
  { id: 'first_client', label: 'First Client', route: '/crm/customers', achievedAt: (facts) => facts.firstCustomerAt },
];

const RETAIL_MILESTONES: MilestoneDefinition[] = [
  { id: 'first_lead', label: 'First Lead', route: '/crm', achievedAt: (facts) => facts.firstLeadAt },
  { id: 'first_customer', label: 'First Customer', route: '/crm/customers', achievedAt: (facts) => facts.firstCustomerAt },
  { id: 'first_sale', label: 'First Sale', route: '/sales', achievedAt: (facts) => facts.firstSaleAt },
];

const TEAM_MILESTONES: MilestoneDefinition[] = [
  { id: 'first_prospect', label: 'First Prospect', route: '/crm', achievedAt: (facts) => facts.firstLeadAt },
  { id: 'first_recruit', label: 'First Recruit', route: '/ai-workforce', achievedAt: (facts) => facts.firstTeamMemberAt },
  { id: 'first_team_member', label: 'First Team Member', route: '/ai-workforce', achievedAt: (facts) => facts.firstTeamMemberAt },
];

export function milestoneDefinitionsFor(mode: InterviewAuthorityBusinessMode): MilestoneDefinition[] {
  switch (mode) {
    case 'creator':
      return CREATOR_MILESTONES;
    case 'service':
      return SERVICE_MILESTONES;
    case 'team_building':
      return TEAM_MILESTONES;
    case 'hybrid':
      return [...CREATOR_MILESTONES, ...RETAIL_MILESTONES];
    case 'retail':
    default:
      return RETAIL_MILESTONES;
  }
}

export function buildValueMilestones(facts: OutcomeFacts): ValueMilestone[] {
  return milestoneDefinitionsFor(facts.businessMode).map((definition) => {
    const achievedAt = definition.achievedAt(facts);
    return {
      id: definition.id,
      label: definition.label,
      route: definition.route,
      achieved: Boolean(achievedAt),
      achievedAt: achievedAt?.toISOString() ?? null,
    };
  });
}
