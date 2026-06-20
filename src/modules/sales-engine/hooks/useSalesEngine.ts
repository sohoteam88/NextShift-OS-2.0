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
    lockReason: '先完成获客和 CRM 跟进。等你有可跟进的潜在客户后，销售中心会自动解锁。',
    stats,
    forecast,
    identifyObjection,
    generateResponse,
    showFeatures: level === 'operator' || level === 'leader',
    showAdvanced: level === 'leader',
  };
}
