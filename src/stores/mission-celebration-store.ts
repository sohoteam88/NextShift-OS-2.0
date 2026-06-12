import { create } from 'zustand';
import type { JourneyStage } from '@/modules/mission/constants/journey-map';

type MissionCelebrationPayload = {
  stage: JourneyStage;
  xp: number;
  achievements: string[];
};

interface MissionCelebrationState {
  pending: MissionCelebrationPayload | null;
  trigger: (data: MissionCelebrationPayload) => void;
  clear: () => void;
}

export const useMissionCelebrationStore = create<MissionCelebrationState>((set) => ({
  pending: null,
  trigger: (data) => set({ pending: data }),
  clear: () => set({ pending: null }),
}));

export function triggerMissionCelebrationFromResponse(response: unknown) {
  const root = response && typeof response === 'object' ? (response as { data?: unknown; mission?: unknown }) : null;
  const mission = root?.mission ?? root?.data ?? null;
  if (!mission || typeof mission !== 'object') return;

  const payload = mission as {
    newlyCompleted?: JourneyStage | null;
    isNewMilestone?: boolean;
    newAchievements?: string[];
  };

  if (!payload.isNewMilestone || !payload.newlyCompleted) return;

  useMissionCelebrationStore.getState().trigger({
    stage: payload.newlyCompleted,
    xp: payload.newlyCompleted.xp_reward,
    achievements: payload.newAchievements ?? [],
  });
}
