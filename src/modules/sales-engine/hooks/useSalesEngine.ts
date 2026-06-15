'use client';

import { useUserEvolution } from '@/modules/user-evolution/hooks/useUserEvolution';
import { calculateRevenueStats, forecastRevenue } from '../services/revenue-service';
import { identifyObjection, generateResponse } from '../services/objection-service';

export function useSalesEngine() {
  const evolution = useUserEvolution();
  const isLocked = evolution.level === 'explorer' || evolution.level === 'builder';

  const stats = calculateRevenueStats({});
  const forecast = forecastRevenue(stats.revenue, stats.closeRate, stats.proposalsSent * 500);

  return {
    isLocked,
    lockReason: 'Unlocks at Operator Level. Complete Lead Generation and CRM first.',
    stats,
    forecast,
    identifyObjection,
    generateResponse,
    showFeatures: evolution.level === 'operator' || evolution.level === 'leader',
    showAdvanced: evolution.level === 'leader',
  };
}
