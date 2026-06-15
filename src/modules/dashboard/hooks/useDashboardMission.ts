'use client';

import { useQuery } from '@tanstack/react-query';
import { useMissionState } from '@/modules/mission/hooks/use-mission';
import { getNextJourneyAction } from '@/modules/journey/utils/getNextJourneyAction';
import { getUserLevel } from '@/modules/user-evolution/services/user-level-service';
import { getCurrentMission } from '@/modules/mission-engine/services/mission-service';
import { getAICoachAdvice } from '@/modules/ai-coach/ai-coach-service';
import type { JourneyNextAction } from '@/modules/journey/utils/getNextJourneyAction';
import type { UserEvolutionState } from '@/modules/user-evolution/services/user-level-service';
import type { Mission } from '@/modules/mission-engine/types/mission.types';

interface BusinessSnapshot { content: number; leads: number; customers: number; revenue: number; }

interface DashboardMission {
  nextAction: JourneyNextAction;
  userLevel: UserEvolutionState;
  mission: Mission;
  progress: { currentStep: number; totalSteps: number; pct: number; stageName: string };
  aiCoachMessage: { why: string; outcome: string; mistake: string; nextBestAction: string; encouragement: string; time: string };
  businessSnapshot: BusinessSnapshot;
  isLoading: boolean;
}

function useQuickStats() {
  return useQuery({
    queryKey: ['dashboard-quick-stats'],
    queryFn: async () => {
      const res = await fetch('/api/v1/team/summary');
      if (!res.ok) return { content: 0, leads: 0, customers: 0, revenue: 0 };
      const json = await res.json() as { data?: any };
      const d = json.data ?? {};
      return {
        content: d.contentCount ?? d.content?.total ?? 0,
        leads: d.leadCount ?? d.leads?.total ?? 0,
        customers: d.customerCount ?? d.customers?.total ?? 0,
        revenue: d.revenue ?? d.mrr ?? 0,
      };
    },
    staleTime: 60_000,
  });
}

export function useDashboardMission(): DashboardMission {
  const mission = useMissionState();
  const stats = useQuickStats();
  const state = mission.data?.data;
  const completedChecks = state?.completedChecks ?? [];
  const checkSet = new Set(completedChecks);
  const pct = state?.progressPercent ?? 0;

  const nextAction = getNextJourneyAction({
    brandInterview: checkSet.has('brand_interview') || pct >= 10,
    brandDNA: checkSet.has('brand_dna') || pct >= 25,
    firstContent: checkSet.has('first_content') || pct >= 40,
    firstLead: checkSet.has('first_lead') || pct >= 55,
    firstCustomer: checkSet.has('first_customer') || pct >= 70,
    followUpSystem: checkSet.has('follow_up_system') || pct >= 85,
    firstMember: checkSet.has('first_member') || pct >= 95,
  });

  const userLevel = getUserLevel({
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

  const currentMission = getCurrentMission({
    level: userLevel.level,
    brandInterview: checkSet.has('brand_interview') || pct >= 10,
    brandDNA: checkSet.has('brand_dna') || pct >= 25,
    socialSetup: checkSet.has('social_setup') || pct >= 35,
    hasContent: pct >= 40,
    hasLead: pct >= 55,
    hasCustomer: pct >= 70,
    teamMemberCount: pct >= 90 ? 1 : 0,
  });

  const coach = getAICoachAdvice(currentMission.id);

  return {
    nextAction,
    userLevel,
    mission: currentMission,
    progress: {
      currentStep: nextAction.progressStep,
      totalSteps: nextAction.totalSteps,
      pct: Math.round((nextAction.progressStep / nextAction.totalSteps) * 100),
      stageName: nextAction.stageName,
    },
    aiCoachMessage: {
      why: coach.why,
      outcome: coach.outcome,
      mistake: coach.mistake,
      nextBestAction: coach.nextBestAction,
      encouragement: coach.encouragement,
      time: `${nextAction.estimatedMinutes} 分钟`,
    },
    businessSnapshot: {
      content: stats.data?.content ?? 0,
      leads: stats.data?.leads ?? 0,
      customers: stats.data?.customers ?? 0,
      revenue: stats.data?.revenue ?? 0,
    },
    isLoading: mission.isLoading || stats.isLoading,
  };
}
