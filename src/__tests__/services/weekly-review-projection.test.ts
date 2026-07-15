import { describe, expect, it } from 'vitest';
import type { BusinessMemoryEvent } from '@/modules/business-context-memory/contracts/BusinessContextMemory';
import { buildWeeklyReviewProjection } from '@/modules/business-context-memory/services/weekly-review-projection';

const now = new Date('2026-07-14T12:00:00.000Z');

describe('Weekly review projection', () => {
  it('includes an event exactly at the seven-day boundary and excludes one outside it', () => {
    const result = buildWeeklyReviewProjection({
      now,
      events: [
        event({ id: 'inside', occurredAt: '2026-07-07T12:00:00.000Z', title: 'Inside window' }),
        event({ id: 'outside', occurredAt: '2026-07-07T11:59:59.999Z', title: 'Outside window' }),
      ],
    });

    expect(result.activities.map((activity) => activity.title)).toEqual(['Inside window']);
    expect(result.windowStart).toBe('2026-07-07T12:00:00.000Z');
    expect(result.windowEnd).toBe(now.toISOString());
  });

  it('deduplicates recommendation counts by reference id inside the window', () => {
    const result = buildWeeklyReviewProjection({
      now,
      events: [
        event({ id: 'issued-1', type: 'RECOMMENDATION_ISSUED', referenceId: 'recommendation_1' }),
        event({ id: 'issued-2', type: 'RECOMMENDATION_ISSUED', referenceId: 'recommendation_1' }),
        event({ id: 'issued-3', type: 'RECOMMENDATION_ISSUED', referenceId: 'recommendation_2' }),
        event({ id: 'accepted-1', type: 'RECOMMENDATION_ACCEPTED', referenceId: 'recommendation_1' }),
        event({ id: 'accepted-2', type: 'RECOMMENDATION_ACCEPTED', referenceId: 'recommendation_1' }),
        event({ id: 'ignored-1', type: 'RECOMMENDATION_IGNORED', referenceId: 'recommendation_2' }),
        event({ id: 'ignored-2', type: 'RECOMMENDATION_IGNORED', referenceId: 'recommendation_2' }),
      ],
    });

    expect(result.recommendationsIssued).toBe(2);
    expect(result.recommendationsAccepted).toBe(1);
    expect(result.recommendationsIgnored).toBe(1);
  });

  it('treats an invalid timestamp as outside the window', () => {
    const result = buildWeeklyReviewProjection({
      now,
      events: [event({ id: 'invalid', occurredAt: 'not-a-date' })],
    });

    expect(result.activities).toEqual([]);
    expect(result.hasActivity).toBe(false);
  });

  it('marks an empty week without activity as an honest empty state', () => {
    const result = buildWeeklyReviewProjection({ now, events: [] });

    expect(result.hasActivity).toBe(false);
    expect(result.completedMissions).toBe(0);
    expect(result.recommendationsIssued).toBe(0);
  });

  it('counts a completed mission derived from the mission read model', () => {
    const result = buildWeeklyReviewProjection({
      now,
      events: [event({
        id: 'mission:mission_1:completed',
        type: 'MISSION_COMPLETED',
        title: 'Finish brand profile',
        referenceId: 'mission_1',
        metadata: { source: 'mission_read_model', status: 'completed' },
      })],
    });

    expect(result.completedMissions).toBe(1);
    expect(result.activities).toHaveLength(1);
  });
});

function event(overrides: Partial<BusinessMemoryEvent> = {}): BusinessMemoryEvent {
  return {
    id: 'event_1',
    type: 'MISSION_COMPLETED',
    tenantId: 'tenant_1',
    userId: 'user_1',
    occurredAt: '2026-07-13T12:00:00.000Z',
    title: 'Complete a mission',
    summary: 'Mission complete',
    ...overrides,
  };
}
