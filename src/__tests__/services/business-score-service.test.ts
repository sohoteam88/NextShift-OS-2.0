import { afterEach, describe, expect, it, vi } from 'vitest';
import { calculateBusinessScore } from '@nextshift/business-command-center-v1';
import {
  getBusinessScore,
  type BusinessScoreDependencies,
} from '@/modules/dashboard/services/business-score-service';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Business Score service', () => {
  it('delegates to the domain policy and converts CRM confidence into a unit value', async () => {
    const fixture = createDependencies({ readinessScore: 64, confidenceScore: 80 });

    const result = await getBusinessScore(user(), fixture.dependencies);

    expect(fixture.calculateScore).toHaveBeenCalledWith({
      readinessScore: 64,
      forecastConfidence: 0.8,
    });
    expect(result).toEqual({
      ...calculateBusinessScore({ readinessScore: 64, forecastConfidence: 0.8 }),
      factors: [
        { source: 'analytics.projection.readiness.value', value: 64 },
        { source: 'crm.revenueForecast.confidenceScore', value: 80 },
      ],
    });
  });

  it.each([
    [59, 59],
    [60, 60],
    [79, 79],
    [80, 80],
  ])('matches the domain policy at the %s score boundary', async (readinessScore, confidenceScore) => {
    const fixture = createDependencies({
      readinessScore,
      confidenceScore,
      useDefaultPolicy: true,
    });

    const result = await getBusinessScore(user(), fixture.dependencies);

    expect(result).toMatchObject(
      calculateBusinessScore({
        readinessScore,
        forecastConfidence: confidenceScore / 100,
      }),
    );
  });

  it('returns null and does not load runtime inputs when the user has no tenant', async () => {
    const fixture = createDependencies();
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const result = await getBusinessScore({ id: 'user_1', tenantId: null }, fixture.dependencies);

    expect(result).toBeNull();
    expect(fixture.loadContext).not.toHaveBeenCalled();
    expect(fixture.loadCrmCommandCenter).not.toHaveBeenCalled();
    expect(warning).toHaveBeenCalledWith(
      '[business-score] unavailable without tenant context',
      { userId: 'user_1' },
    );
  });

  it('returns null when CRM command-center loading fails', async () => {
    const fixture = createDependencies();
    fixture.loadCrmCommandCenter.mockRejectedValueOnce(new Error('CRM unavailable'));
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const result = await getBusinessScore(user(), fixture.dependencies);

    expect(result).toBeNull();
    expect(warning).toHaveBeenCalledWith(
      '[business-score] unable to load score inputs',
      expect.objectContaining({ error: 'CRM unavailable' }),
    );
  });

  it('returns null when CRM forecast confidence is outside its percentage range', async () => {
    const fixture = createDependencies({ confidenceScore: 101 });
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const result = await getBusinessScore(user(), fixture.dependencies);

    expect(result).toBeNull();
    expect(warning).toHaveBeenCalledWith(
      '[business-score] CRM forecast confidence is invalid',
      expect.objectContaining({ confidenceScore: 101 }),
    );
  });
});

function user() {
  return {
    id: 'user_1',
    tenantId: 'tenant_1',
  };
}

function createDependencies(input: {
  readinessScore?: number;
  confidenceScore?: number;
  useDefaultPolicy?: boolean;
} = {}) {
  const readinessScore = input.readinessScore ?? 80;
  const confidenceScore = input.confidenceScore ?? 80;
  const loadContext = vi.fn().mockResolvedValue({
    analytics: {
      projection: {
        readiness: { value: readinessScore },
      },
    },
  });
  const loadCrmCommandCenter = vi.fn().mockResolvedValue({
    revenueForecast: { confidenceScore },
  });
  const calculateScore = vi.fn(calculateBusinessScore);
  const dependencies = {
    loadContext,
    loadCrmCommandCenter,
    ...(input.useDefaultPolicy ? {} : { calculateScore }),
  } as BusinessScoreDependencies;

  return {
    dependencies,
    loadContext,
    loadCrmCommandCenter,
    calculateScore,
  };
}
