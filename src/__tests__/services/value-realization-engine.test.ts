import { describe, expect, it } from 'vitest';
import { buildValueProjection } from '@/modules/value/services/value-projection';
import type { OutcomeFacts } from '@/modules/value/services/outcome-tracker';

function facts(patch: Partial<OutcomeFacts> = {}): OutcomeFacts {
  return {
    businessMode: 'retail',
    generatedAt: '2026-06-19T00:00:00.000Z',
    leadsGenerated: 0,
    appointmentsBooked: 0,
    customersAcquired: 0,
    revenueGenerated: 0,
    teamMembersRecruited: 0,
    contentPublished: 0,
    viewsGenerated: 0,
    firstContentPublishedAt: null,
    first100ViewsAt: null,
    first1000ViewsAt: null,
    firstLeadAt: null,
    firstAppointmentAt: null,
    firstCustomerAt: null,
    firstSaleAt: null,
    firstTeamMemberAt: null,
    ...patch,
  };
}

describe('CUSTOMER-003 value realization engine', () => {
  it('detects no business outcome as value risk', () => {
    const projection = buildValueProjection(facts());

    expect(projection.valueRealizationScore).toBe(0);
    expect(projection.currentValueStage).toBe('not_started');
    expect(projection.valueRisk).toBe('high');
    expect(projection.nextMilestone).toMatchObject({ id: 'first_lead' });
    expect(projection.blockers[0]).toMatchObject({ code: 'no_leads_generated' });
  });

  it('marks retail first sale as first win and growing value', () => {
    const projection = buildValueProjection(facts({
      leadsGenerated: 3,
      appointmentsBooked: 1,
      customersAcquired: 1,
      revenueGenerated: 500,
      firstLeadAt: new Date('2026-06-19T00:01:00.000Z'),
      firstAppointmentAt: new Date('2026-06-19T00:02:00.000Z'),
      firstCustomerAt: new Date('2026-06-19T00:03:00.000Z'),
      firstSaleAt: new Date('2026-06-19T00:04:00.000Z'),
    }));

    expect(projection.valueRealizationScore).toBe(100);
    expect(projection.currentValueStage).toBe('scaling');
    expect(projection.valueRisk).toBe('low');
    expect(projection.latestWin).toMatchObject({ id: 'first_sale' });
    expect(projection.kpis).toMatchObject({
      firstLeadRate: 100,
      firstCustomerRate: 100,
      firstSaleRate: 100,
    });
  });

  it('uses creator milestones for views', () => {
    const projection = buildValueProjection(facts({
      businessMode: 'creator',
      contentPublished: 1,
      viewsGenerated: 120,
      firstContentPublishedAt: new Date('2026-06-19T00:01:00.000Z'),
      first100ViewsAt: new Date('2026-06-19T00:02:00.000Z'),
    }));

    expect(projection.milestones.map((milestone) => milestone.id)).toEqual([
      'first_content_published',
      'first_100_views',
      'first_1000_views',
    ]);
    expect(projection.latestWin).toMatchObject({ id: 'first_100_views' });
    expect(projection.nextMilestone).toMatchObject({ id: 'first_1000_views' });
  });
});
