import { describe, expect, it } from 'vitest';
import { buildRetentionProjection } from '@/modules/retention/services/retention-projection';
import type { RetentionFacts } from '@/modules/retention/services/retention-score-engine';

const createdAt = new Date('2026-05-01T00:00:00.000Z');

function facts(patch: Partial<RetentionFacts> = {}): RetentionFacts & { recentWins: [] } {
  return {
    userCreatedAt: createdAt,
    lastActivityAt: new Date('2026-06-18T00:00:00.000Z'),
    generatedAt: '2026-06-19T00:00:00.000Z',
    loginEvents30d: 6,
    activeDays30d: 6,
    missionCompleted30d: 3,
    missionTotal30d: 4,
    contentGenerated30d: 3,
    executionCompleted30d: 2,
    executionFailed30d: 0,
    aiCooInteractions30d: 3,
    leadMagnetsCreated30d: 1,
    funnelsLaunched30d: 1,
    winsAchieved30d: 5,
    recentWins: [],
    ...patch,
  };
}

describe('CUSTOMER-002 user retention engine', () => {
  it('marks active users as retained with momentum', () => {
    const projection = buildRetentionProjection(facts());

    expect(projection.retentionScore).toBeGreaterThan(60);
    expect(projection.retentionRisk).toBe('low');
    expect(projection.retentionState).toMatch(/active_user|engaged_user/);
    expect(projection.momentumScore).toBeGreaterThan(70);
    expect(projection.reEngagement.needed).toBe(false);
  });

  it('detects 14 day inactivity as high retention risk', () => {
    const projection = buildRetentionProjection(facts({
      lastActivityAt: new Date('2026-06-05T00:00:00.000Z'),
      loginEvents30d: 0,
      activeDays30d: 0,
      missionCompleted30d: 0,
      missionTotal30d: 4,
      contentGenerated30d: 0,
      executionCompleted30d: 0,
      aiCooInteractions30d: 0,
      leadMagnetsCreated30d: 0,
      funnelsLaunched30d: 0,
      winsAchieved30d: 0,
    }));

    expect(projection.inactivityFlag).toBe('14_days_inactive');
    expect(projection.retentionRisk).toBe('high');
    expect(projection.retentionState).toBe('inactive');
    expect(projection.reEngagement).toMatchObject({
      needed: true,
      priority: 'high',
      title: 'Restart with one quick win',
    });
  });

  it('detects 30 day inactivity as churn risk', () => {
    const projection = buildRetentionProjection(facts({
      lastActivityAt: new Date('2026-05-10T00:00:00.000Z'),
      activeDays30d: 0,
    }));

    expect(projection.inactivityFlag).toBe('30_days_inactive');
    expect(projection.retentionRisk).toBe('critical');
    expect(projection.retentionState).toBe('churn_risk');
  });
});
