'use client';

import { useMissionState } from '@/modules/mission/hooks/use-mission';
import { getGrowthRoadmapState } from '../services/roadmap-service';
import { useQuery } from '@tanstack/react-query';

function useQuickStats() {
  return useQuery({
    queryKey: ['dashboard-quick-stats'],
    queryFn: async () => {
      const res = await fetch('/api/v1/team/summary');
      if (!res.ok) return { content: 0, leads: 0, customers: 0, revenue: 0 };
      const json = await res.json() as { data?: any };
      const d = json.data ?? {};
      return { content: d.contentCount ?? 0, leads: d.leadCount ?? 0, customers: d.customerCount ?? 0 };
    },
    staleTime: 60_000,
  });
}

export function useGrowthRoadmap() {
  const mission = useMissionState();
  const stats = useQuickStats();
  const state = mission.data?.data;
  const completedChecks = state?.completedChecks ?? [];
  const checkSet = new Set(completedChecks);
  const pct = state?.progressPercent ?? 0;

  const roadmap = getGrowthRoadmapState({
    brandInterview: checkSet.has('brand_interview') || pct >= 10,
    brandDNA: checkSet.has('brand_dna') || pct >= 25,
    socialSetup: checkSet.has('social_setup') || pct >= 35,
    contentCount: stats.data?.content ?? 0,
    leadCount: stats.data?.leads ?? 0,
    customerCount: stats.data?.customers ?? 0,
    teamMemberCount: 0,
    crmActive: checkSet.has('crm_setup'),
    followUpActive: checkSet.has('follow_up_active'),
  });

  return { roadmap, isLoading: mission.isLoading || stats.isLoading };
}
