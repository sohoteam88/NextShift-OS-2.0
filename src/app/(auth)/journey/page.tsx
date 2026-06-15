'use client';

import { useMissionState } from '@/modules/mission/hooks/use-mission';
import { BeginnerJourneyView } from '@/modules/journey/components/BeginnerJourneyView';
import { getNextJourneyAction } from '@/modules/journey/utils/getNextJourneyAction';

export default function JourneyPage() {
  const mission = useMissionState();
  const state = mission.data?.data;

  const completedChecks = state?.completedChecks ?? [];
  const checkSet = new Set(completedChecks);
  const journeyAction = getNextJourneyAction({
    brandInterview: checkSet.has('brand_interview') || (state?.progressPercent ?? 0) >= 10,
    brandDNA: checkSet.has('brand_dna') || (state?.progressPercent ?? 0) >= 25,
    firstContent: checkSet.has('first_content') || (state?.progressPercent ?? 0) >= 40,
    firstLead: checkSet.has('first_lead') || (state?.progressPercent ?? 0) >= 55,
    firstCustomer: checkSet.has('first_customer') || (state?.progressPercent ?? 0) >= 70,
    followUpSystem: checkSet.has('follow_up_system') || (state?.progressPercent ?? 0) >= 85,
    firstMember: checkSet.has('first_member') || (state?.progressPercent ?? 0) >= 95,
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <BeginnerJourneyView action={journeyAction} locale="zh" />
    </div>
  );
}
