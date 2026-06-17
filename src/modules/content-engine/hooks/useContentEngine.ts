'use client';

import { useEvolutionProjection } from '@/modules/evolution/hooks/use-evolution-projection';
import { generateContentStrategy } from '../services/content-strategy-service';
import { generateContentPillars } from '../services/content-pillar-service';
import { scoreContent } from '../services/content-scoring-service';

export function useContentEngine(brandContext?: { audience?: string; industry?: string; goal?: string }) {
  const projection = useEvolutionProjection();
  const snapshot = projection.snapshot;
  const level = snapshot?.level ?? 'explorer';
  const unlockedModules = snapshot?.unlockedModules ?? [];
  const strategy = generateContentStrategy({ level, brandContext });
  const pillars = generateContentPillars(brandContext);
  const isUnlocked = unlockedModules.includes('content-engine');

  return {
    strategy,
    pillars,
    scoreContent: (input: Parameters<typeof scoreContent>[0]) => scoreContent(input),
    isUnlocked,
    lockReason: isUnlocked ? null : 'Complete Brand Foundation first.',
    level,
  };
}
