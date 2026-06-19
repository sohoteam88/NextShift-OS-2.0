'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMissionState } from '@/modules/mission/hooks/use-mission';
import { evolutionProjection } from '../projections/evolution-projection';
import { buildLegacyEvolutionSnapshot } from '@/modules/user-evolution/adapters/legacy-evolution-bridge';
import { resolveJourneyCompletion } from '@/modules/journey/services/JourneyCompletionResolver';
import { deriveLevel } from '../core/derive-level';
import { deriveUnlocks } from '../core/derive-unlocks';
import type { EvolutionSnapshot } from '../types/evolution-snapshot';

export interface UseEvolutionProjectionResult {
  snapshot: EvolutionSnapshot | null;
  isLoading: boolean;
  error: Error | null;
}

const ENABLE_EVOLUTION_PROJECTION_V6 = process.env.NEXT_PUBLIC_ENABLE_EVOLUTION_PROJECTION_V6 === 'true';

type AuthMeResponse = {
  data: {
    user: {
      id: string;
    };
  };
};

function useAuthMe(enabled: boolean) {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const res = await fetch('/api/v1/auth/me');
      if (!res.ok) throw new Error('Failed to load auth user');
      return res.json() as Promise<AuthMeResponse>;
    },
    staleTime: 60_000,
    enabled,
  });
}

export function useEvolutionProjection(userId?: string): UseEvolutionProjectionResult {
  const mission = useMissionState();
  const authMe = useAuthMe(ENABLE_EVOLUTION_PROJECTION_V6 && !userId);
  const [projectionSnapshot, setProjectionSnapshot] = React.useState<EvolutionSnapshot | null>(null);
  const [projectionError, setProjectionError] = React.useState<Error | null>(null);
  const [projectionLoading, setProjectionLoading] = React.useState(false);
  const resolvedUserId = userId ?? authMe.data?.data.user.id;

  const legacySnapshot = React.useMemo(() => {
    const state = mission.data?.data;
    const completion = resolveJourneyCompletion({
      completedChecks: state?.completedChecks,
      progressPercent: state?.progressPercent,
    });
    const pct = completion.progressPercent;

    const input = {
      brandInterview: completion.brandInterview,
      brandDNA: completion.brandDNA,
      socialSetup: completion.socialSetup,
      contentCount: pct >= 40 ? 3 : pct >= 30 ? 1 : 0,
      leadCount: pct >= 55 ? 1 : 0,
      customerCount: pct >= 70 ? 1 : 0,
      teamMemberCount: pct >= 90 ? 1 : 0,
      crmActive: completion.followUpSystem,
      followUpActive: completion.followUpSystem,
    };

    const levelState = deriveLevel(input);
    return buildLegacyEvolutionSnapshot({
      level: levelState.level,
      progressPercentage: levelState.progressPercentage,
      completedMilestones: levelState.completedMilestones,
      unlockedModules: deriveUnlocks(levelState.level),
      nextMilestone: levelState.nextMilestone ?? 'brand_interview',
    });
  }, [mission.data?.data]);

  React.useEffect(() => {
    let cancelled = false;

    if (!ENABLE_EVOLUTION_PROJECTION_V6 || !resolvedUserId) {
      setProjectionSnapshot(null);
      setProjectionError(null);
      setProjectionLoading(false);
      return;
    }

    setProjectionLoading(true);
    setProjectionError(null);

    evolutionProjection
      .getSnapshot(resolvedUserId)
      .then((snapshot) => {
        if (cancelled) return;
        setProjectionSnapshot(snapshot);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setProjectionError(error instanceof Error ? error : new Error('Failed to load evolution projection'));
      })
      .finally(() => {
        if (cancelled) return;
        setProjectionLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [resolvedUserId]);

  return {
    snapshot: ENABLE_EVOLUTION_PROJECTION_V6 ? projectionSnapshot ?? legacySnapshot : legacySnapshot,
    isLoading: ENABLE_EVOLUTION_PROJECTION_V6 ? projectionLoading || authMe.isLoading || mission.isLoading : mission.isLoading,
    error: ENABLE_EVOLUTION_PROJECTION_V6 ? projectionError : null,
  };
}
