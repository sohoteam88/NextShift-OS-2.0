import type { OutcomeMetrics } from '../contracts/ValueProjection';

export type OutcomeFacts = OutcomeMetrics & {
  businessMode: 'creator' | 'service' | 'retail' | 'team_building' | 'hybrid';
  firstContentPublishedAt: Date | null;
  first100ViewsAt: Date | null;
  first1000ViewsAt: Date | null;
  firstLeadAt: Date | null;
  firstAppointmentAt: Date | null;
  firstCustomerAt: Date | null;
  firstSaleAt: Date | null;
  firstTeamMemberAt: Date | null;
  generatedAt: string;
};

export function hasBusinessOutcome(metrics: OutcomeMetrics) {
  return metrics.leadsGenerated > 0
    || metrics.appointmentsBooked > 0
    || metrics.customersAcquired > 0
    || metrics.revenueGenerated > 0
    || metrics.teamMembersRecruited > 0
    || metrics.viewsGenerated >= 100;
}
