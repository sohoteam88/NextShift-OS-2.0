'use client';

import { useQuery } from '@tanstack/react-query';
import { useEvolutionProjection } from '@/modules/evolution/hooks/use-evolution-projection';
import { useMissionState } from '@/modules/mission/hooks/use-mission';
import { getNextJourneyAction } from '@/modules/journey/utils/getNextJourneyAction';
import {
  resolveJourneyCompletion,
  toJourneyNextActionInput,
  toMissionInput,
} from '@/modules/journey/services/JourneyCompletionResolver';
import { getCurrentMission } from '@/modules/mission-engine/services/mission-service';
import { getAICoachAdvice } from '@/modules/ai-coach/ai-coach-service';
import type { JourneyNextAction } from '@/modules/journey/utils/getNextJourneyAction';
import type { EvolutionSnapshot } from '@/modules/evolution/types/evolution-snapshot';
import type { Mission } from '@/modules/mission-engine/types/mission.types';

interface BusinessSnapshot { content: number; leads: number; customers: number; revenue: number; }

interface DashboardMission {
  nextAction: JourneyNextAction;
  userLevel: Pick<EvolutionSnapshot, 'level' | 'progressPercentage' | 'currentStage' | 'unlockedModules'>;
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
  const { snapshot, isLoading: evolutionIsLoading } = useEvolutionProjection();
  const stats = useQuickStats();
  const state = mission.data?.data;
  const completion = resolveJourneyCompletion({
    completedChecks: state?.completedChecks,
    progressPercent: state?.progressPercent,
  });
  const levelSnapshot = snapshot ?? {
    level: 'explorer',
    progressPercentage: 0,
    currentStage: 'brand_foundation',
    nextLevel: 'builder',
    unlockedModules: ['dashboard', 'journey', 'brand-builder'],
    completedMissions: 0,
    totalMissions: 0,
  };

  const nextAction = getNextJourneyAction(toJourneyNextActionInput(completion));

  const currentMission = getCurrentMission(toMissionInput(completion, levelSnapshot.level));

  const coach = getAICoachAdvice(currentMission.id);

  return {
    nextAction,
    userLevel: {
      level: levelSnapshot.level,
      progressPercentage: levelSnapshot.progressPercentage,
      currentStage: levelSnapshot.currentStage,
      unlockedModules: levelSnapshot.unlockedModules,
    },
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
    isLoading: mission.isLoading || stats.isLoading || evolutionIsLoading,
  };
}
