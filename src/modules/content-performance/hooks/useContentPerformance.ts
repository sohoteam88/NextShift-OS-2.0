'use client';

import { useUserEvolution } from '@/modules/user-evolution/hooks/useUserEvolution';
import type { PerformanceLevel } from '../types/performance.types';

function getPerformanceLevel(level: string): PerformanceLevel {
  switch (level) {
    case 'explorer': return 'locked';
    case 'builder': return 'basic';
    case 'operator': return 'lead';
    case 'leader': return 'advanced';
    default: return 'locked';
  }
}

export function useContentPerformance() {
  const evolution = useUserEvolution();
  const perfLevel = getPerformanceLevel(evolution.level);

  return {
    performanceLevel: perfLevel,
    isLocked: perfLevel === 'locked',
    showBasic: perfLevel !== 'locked',
    showLeadMetrics: perfLevel === 'lead' || perfLevel === 'advanced',
    showAdvanced: perfLevel === 'advanced',
    lockReason: perfLevel === 'locked' ? 'Complete Brand Foundation and publish content to unlock analytics.' : null,
  };
}
