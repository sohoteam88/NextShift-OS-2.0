// Revenue Engine — revenue tracking and forecasting

import type { SalesStats } from '../types/sales.types';

interface RevenueInput {
  proposalsSent?: number;
  proposalsViewed?: number;
  won?: number;
  lost?: number;
  revenue?: number;
  leadCount?: number;
}

export function calculateRevenueStats(input: RevenueInput): SalesStats {
  const proposalsSent = input.proposalsSent ?? 18;
  const proposalsViewed = input.proposalsViewed ?? 13;
  const won = input.won ?? 5;
  const lost = input.lost ?? 8;
  const closing = input.proposalsSent ?? 0 - (won + lost);
  const revenue = input.revenue ?? 6500;
  const leadCount = input.leadCount ?? 52;

  return {
    proposalsSent, proposalsViewed, closing: Math.max(0, closing), won, lost,
    closeRate: proposalsSent > 0 ? Math.round((won / proposalsSent) * 1000) / 10 : 0,
    revenue,
    revenuePerLead: leadCount > 0 ? Math.round(revenue / leadCount) : 0,
    averageOrderValue: won > 0 ? Math.round(revenue / won) : 0,
  };
}

export function forecastRevenue(currentRevenue: number, closeRate: number, pipelineValue: number): { nextMonth: number; threeMonths: number } {
  const improvementRate = 1.02; // 2% assumed monthly improvement
  return {
    nextMonth: Math.round(currentRevenue * improvementRate),
    threeMonths: Math.round(currentRevenue * improvementRate * improvementRate * improvementRate),
  };
}
