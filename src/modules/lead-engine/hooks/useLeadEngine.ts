'use client';

import { useEvolutionProjection } from '@/modules/evolution/hooks/use-evolution-projection';
import { calculateLeadScore } from '../services/lead-scoring-service';

export function useLeadEngine() {
  const projection = useEvolutionProjection();
  const snapshot = projection.snapshot;
  const isUnlocked = snapshot?.unlockedModules.includes('lead-engine') ?? false;

  return {
    isLocked: !isUnlocked,
    lockReason: !isUnlocked ? '请先完成品牌基础和内容创建。' : null,
    scoreLead: calculateLeadScore,
    showScoring: snapshot?.level === 'operator' || snapshot?.level === 'leader',
    showAnalytics: snapshot?.level === 'leader',
    pipeline: {
      visitors: 132, leads: 28, qualified: 12, appointments: 5, customers: 3,
      conversionRate: 11,
    },
  };
}
