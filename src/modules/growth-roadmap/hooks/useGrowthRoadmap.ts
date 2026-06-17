'use client';

import { useEvolutionProjection } from '@/modules/evolution/hooks/use-evolution-projection';
import { getGrowthRoadmapState } from '../services/roadmap-service';

export function useGrowthRoadmap() {
  const { snapshot, isLoading } = useEvolutionProjection();
  const roadmap = getGrowthRoadmapState(snapshot);

  return { roadmap, isLoading };
}
