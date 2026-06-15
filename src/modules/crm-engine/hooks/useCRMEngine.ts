'use client';

import { useUserEvolution } from '@/modules/user-evolution/hooks/useUserEvolution';
import { useState } from 'react';
import { getFollowUpStats } from '../services/followup-service';
import type { CRMStats } from '../types/crm.types';

export function useCRMEngine() {
  const evolution = useUserEvolution();
  const [followUpStats] = useState(getFollowUpStats());

  const isLocked = evolution.level === 'explorer' || evolution.level === 'builder';

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
    showPipeline: evolution.level === 'operator' || evolution.level === 'leader',
    showAdvanced: evolution.level === 'leader',
  };
}
