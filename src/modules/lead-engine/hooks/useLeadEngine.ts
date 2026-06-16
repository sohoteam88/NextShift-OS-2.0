'use client';

import { useUserEvolution } from '@/modules/user-evolution/hooks/useUserEvolution';
import { calculateLeadScore } from '../services/lead-scoring-service';

export function useLeadEngine() {
  const evolution = useUserEvolution();
  const isLocked = !evolution.isModuleUnlocked('lead-magnet');

  return {
    isLocked,
    lockReason: evolution.getLockedReason('lead-magnet') ?? '请先完成品牌基础和内容创建。',
    scoreLead: calculateLeadScore,
    showScoring: evolution.level === 'operator' || evolution.level === 'leader',
    showAnalytics: evolution.level === 'leader',
    pipeline: {
      visitors: 132, leads: 28, qualified: 12, appointments: 5, customers: 3,
      conversionRate: 11,
    },
  };
}
