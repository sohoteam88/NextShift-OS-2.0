'use client';

import { useMissionState } from '@/modules/mission/hooks/use-mission';
import { BeginnerJourneyView } from '@/modules/journey/components/BeginnerJourneyView';
import { getNextJourneyAction } from '@/modules/journey/utils/getNextJourneyAction';
import {
  resolveJourneyCompletion,
  toJourneyNextActionInput,
} from '@/modules/journey/services/JourneyCompletionResolver';

export default function JourneyPage() {
  const mission = useMissionState();
  const state = mission.data?.data;

  const completion = resolveJourneyCompletion({
    completedChecks: state?.completedChecks,
    progressPercent: state?.progressPercent,
  });
  const journeyAction = getNextJourneyAction(toJourneyNextActionInput(completion));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <BeginnerJourneyView action={journeyAction} locale="zh" />
    </div>
  );
}
