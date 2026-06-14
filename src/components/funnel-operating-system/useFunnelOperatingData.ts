'use client';

import { useQuery } from '@tanstack/react-query';
import type { BusinessFunnelType } from '@/modules/funnel/types/funnel-context';
import type { FunnelGoal, FunnelHealth, FunnelKPI, FunnelMilestone, FunnelNextAction, FunnelProgress } from '@/modules/funnel/types/funnel-os';

export type FunnelOperatingData = {
  progress: FunnelProgress;
  health: FunnelHealth;
  nextAction: FunnelNextAction;
  milestones: FunnelMilestone[];
  kpi: FunnelKPI[];
  goal: FunnelGoal;
};

export function useFunnelOperatingData(funnelType: BusinessFunnelType) {
  return useQuery({
    queryKey: ['funnel-os', funnelType],
    queryFn: async () => {
      const response = await fetch(`/api/v1/funnel-os?type=${funnelType}`);
      if (!response.ok) throw new Error('Failed to load Funnel OS');
      return response.json() as Promise<{ data: FunnelOperatingData }>;
    },
    staleTime: 30_000,
  });
}

