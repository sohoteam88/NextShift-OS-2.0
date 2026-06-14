'use client';

import { useQuery } from '@tanstack/react-query';
import type { BusinessFunnelType } from '@/modules/funnel/types/funnel-context';
import type { FunnelProgress, FunnelHealth, FunnelNextAction, FunnelMilestone } from '@/modules/funnel/types/funnel-os';

export function useFunnelOS(funnelType: BusinessFunnelType) {
  return useQuery({
    queryKey: ['funnel-os', funnelType],
    queryFn: async () => {
      const r = await fetch(`/api/v1/funnel-os?type=${funnelType}`);
      if (!r.ok) throw new Error('Failed');
      return r.json() as Promise<{ data: { progress: FunnelProgress; health: FunnelHealth; nextAction: FunnelNextAction; milestones: FunnelMilestone[]; kpi: any[] } }>;
    },
    staleTime: 30_000,
  });
}
