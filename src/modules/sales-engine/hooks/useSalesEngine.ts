'use client';

import { useEvolutionProjection } from '@/modules/evolution/hooks/use-evolution-projection';
import { calculateRevenueStats, forecastRevenue } from '../services/revenue-service';
import { identifyObjection, generateResponse } from '../services/objection-service';

export function useSalesEngine() {
  const { snapshot } = useEvolutionProjection();
  const level = snapshot?.level ?? 'explorer';
  const isLocked = level === 'explorer' || level === 'builder';

  const stats = calculateRevenueStats({});
  const forecast = forecastRevenue(stats.revenue, stats.closeRate, stats.proposalsSent * 500);

  return {
    isLocked,
    lockReason: 'Unlocks at Operator Level. Complete Lead Generation and CRM first.',
    stats,
    forecast,
    identifyObjection,
    generateResponse,
    showFeatures: level === 'operator' || level === 'leader',
    showAdvanced: level === 'leader',
  };
}
