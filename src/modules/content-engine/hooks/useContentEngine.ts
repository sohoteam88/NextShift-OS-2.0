'use client';

import { useUserEvolution } from '@/modules/user-evolution/hooks/useUserEvolution';
import { generateContentStrategy } from '../services/content-strategy-service';
import { generateContentPillars } from '../services/content-pillar-service';
import { scoreContent } from '../services/content-scoring-service';

export function useContentEngine(brandContext?: { audience?: string; industry?: string; goal?: string }) {
  const evolution = useUserEvolution();
  const strategy = generateContentStrategy({ level: evolution.level, brandContext });
  const pillars = generateContentPillars(brandContext);

  return {
    strategy,
    pillars,
    scoreContent: (input: Parameters<typeof scoreContent>[0]) => scoreContent(input),
    isUnlocked: evolution.isModuleUnlocked('content-engine'),
    lockReason: evolution.getLockedReason('content-engine'),
    level: evolution.level,
  };
}
