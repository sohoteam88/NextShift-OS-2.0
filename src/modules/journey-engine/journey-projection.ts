import type { AdaptiveJourneyType, JourneySelection, JourneySelectionInput } from './journey-selector';
import type { AdaptiveJourneyMissionState } from './journey-state-machine';

export type AdaptiveJourneyProjection = {
  source: 'AdaptiveJourneyEngine';
  scope: 'user';
  confidence: 'derived' | 'fallback';
  fallback: string | 'none';
  currentJourney: {
    type: AdaptiveJourneyType;
    title: string;
    reason: string;
  };
  inputs: JourneySelectionInput;
  missions: AdaptiveJourneyMissionState[];
  currentMission: AdaptiveJourneyMissionState;
  nextMission: AdaptiveJourneyMissionState | null;
  progressPath: Array<{
    id: string;
    step: number;
    label: string;
    status: 'completed' | 'current' | 'locked';
  }>;
  nextMilestone: string;
  completionPercentage: number;
};

function toProgressPathStatus(
  mission: AdaptiveJourneyMissionState,
  currentMission: AdaptiveJourneyMissionState,
): 'completed' | 'current' | 'locked' {
  if (mission.status === 'completed') return 'completed';
  if (mission.id === currentMission.id) return 'current';
  return 'locked';
}

export function toJourneyProjection(input: {
  selection: JourneySelection;
  title: string;
  inputs: JourneySelectionInput;
  missions: AdaptiveJourneyMissionState[];
}): AdaptiveJourneyProjection {
  const currentMission =
    input.missions.find((mission) => mission.status === 'active')
    ?? [...input.missions].reverse().find((mission) => mission.status === 'completed')
    ?? input.missions[0];
  const nextMission = currentMission.nextMissionId
    ? input.missions.find((mission) => mission.id === currentMission.nextMissionId) ?? null
    : null;
  const completed = input.missions.filter((mission) => mission.status === 'completed').length;

  return {
    source: 'AdaptiveJourneyEngine',
    scope: 'user',
    confidence: 'derived',
    fallback: 'none',
    currentJourney: {
      type: input.selection.journeyType,
      title: input.title,
      reason: input.selection.reason,
    },
    inputs: input.inputs,
    missions: input.missions,
    currentMission,
    nextMission,
    progressPath: input.missions.map((mission, index) => ({
      id: mission.id,
      step: index + 1,
      label: mission.title,
      status: toProgressPathStatus(mission, currentMission),
    })),
    nextMilestone: nextMission?.title ?? '完成当前旅程',
    completionPercentage: Math.round((completed / input.missions.length) * 100),
  };
}
