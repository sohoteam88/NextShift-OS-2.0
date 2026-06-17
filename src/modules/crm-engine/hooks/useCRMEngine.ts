'use client';

import { useState } from 'react';
import { useEvolutionProjection } from '@/modules/evolution/hooks/use-evolution-projection';
import { getFollowUpStats } from '../services/followup-service';
import type { CRMStats } from '../types/crm.types';

export function useCRMEngine() {
  const { snapshot } = useEvolutionProjection();
  const [followUpStats] = useState(getFollowUpStats());
  const level = snapshot?.level ?? 'explorer';

  const isLocked = level === 'explorer' || level === 'builder';

  const stats: CRMStats = {
    pipeline: { new: 52, contacted: 28, qualified: 14, appointment: 8, proposal: 5, customer: 3, lost: 2, totalValue: 12500, conversionRate: 5.8 },
    dueFollowUps: followUpStats.due,
    overdueFollowUps: followUpStats.overdue,
    hotOpportunities: 5,
    activeCustomers: 3,
    monthlyRevenue: 4500,
  };

  return {
    isLocked,
    lockReason: 'Unlocks at Operator Level. Complete Lead Generation first.',
    stats,
    showPipeline: level === 'operator' || level === 'leader',
    showAdvanced: level === 'leader',
  };
}
