import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CommandCenterRecommendationContext } from '@/lib/command-center-recommendation-context';
import {
  getCommandCenterBusinessScore,
  type CommandCenterBusinessScoreDependencies,
} from '@/modules/dashboard/services/business-score-service';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Command Center business score service', () => {
  it('returns null without loading context when the Command Center flag is off', async () => {
    const loadContext = vi.fn();

    const result = await getCommandCenterBusinessScore(user(), {
      isEnabled: () => false,
      loadContext,
    });

    expect(result).toBeNull();
    expect(loadContext).not.toHaveBeenCalled();
  });

  it.each([
    { readiness: 80, growth: 80, scoreValue: 80, scoreBand: 'strong' },
    { readiness: 60, growth: 60, scoreValue: 60, scoreBand: 'ready' },
    { readiness: 79, growth: 80, scoreValue: 80, scoreBand: 'strong' },
  ])('uses domain score bands and rounding for $readiness readiness and $growth growth', async ({
    readiness,
    growth,
    scoreValue,
    scoreBand,
  }) => {
    const result = await getCommandCenterBusinessScore(user(), dependencies({ readiness, growth }));

    expect(result).toMatchObject({ scoreValue, scoreBand });
  });

  it('normalizes readiness values at and below one, while retaining values above one', async () => {
    const normalized = await getCommandCenterBusinessScore(user(), dependencies({ readiness: 0.8, growth: 50 }));
    const unnormalized = await getCommandCenterBusinessScore(user(), dependencies({ readiness: 2, growth: 50 }));

    expect(normalized).toMatchObject({ scoreValue: 65, scoreBand: 'ready' });
    expect(unnormalized).toMatchObject({ scoreValue: 26, scoreBand: 'needs_attention' });
  });

  it('returns null and logs a runtime fallback warning when context loading fails', async () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await expect(getCommandCenterBusinessScore(user(), {
      isEnabled: () => true,
      loadContext: vi.fn().mockRejectedValue(new Error('context unavailable')),
    })).resolves.toBeNull();

    expect(warning).toHaveBeenCalledWith(
      '[command-center] unable to load business score',
      expect.objectContaining({
        userId: 'user_1',
        tenantId: 'tenant_1',
        error: 'context unavailable',
      }),
    );
  });
});

function user() {
  return {
    id: 'user_1',
    tenantId: 'tenant_1',
  };
}

function dependencies(input: { readiness: number; growth: number }): CommandCenterBusinessScoreDependencies {
  return {
    isEnabled: () => true,
    now: () => new Date('2026-07-13T00:00:00.000Z'),
    loadContext: vi.fn().mockResolvedValue(context(input)),
  };
}

function context({ readiness, growth }: { readiness: number; growth: number }) {
  return {
    user: user(),
    mission: {
      bottleneck: 'NO_CONVERSION',
      priorityAction: { title: 'Convert the next qualified lead' },
      currentMission: { title: 'Convert the next qualified lead' },
    },
    businessState: {
      stateResult: { currentState: 'SALES' },
    },
    analytics: {
      projection: {
        readiness: { value: readiness },
        progress: { value: 65 },
        growth: { value: growth, health: 'medium' },
      },
    },
    memory: { recommendedFocus: 'Follow up with the highest-intent lead' },
  } as CommandCenterRecommendationContext;
}
