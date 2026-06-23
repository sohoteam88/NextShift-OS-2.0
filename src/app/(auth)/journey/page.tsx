import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { businessStateService } from '@/modules/business-state/services/BusinessStateService';
import { activationEngine } from '@/modules/activation/services/activation-engine';
import { BeginnerJourneyView } from '@/modules/journey/components/BeginnerJourneyView';
import type { ExplainabilityLocale } from '@/modules/mission-engine/contracts/MissionAuthority';
import { missionEngineAuthorityService } from '@/modules/mission-engine/services/MissionEngineAuthorityService';
import { outcomeOrchestrator } from '@/modules/mission-engine/services/OutcomeOrchestrator';
import type { BottleneckSignals } from '@/modules/mission-engine/services/BottleneckEngine';

export default async function JourneyPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const locale = (await getLocale()) as ExplainabilityLocale;
  const [businessState, activation] = await Promise.all([
    businessStateService.getBusinessState(user.id),
    activationEngine.getProjection(user.id, user.tenantId),
  ]);
  const authority = await missionEngineAuthorityService.getCurrentMission(user.id, {
    businessState: businessState.stateResult,
    locale,
  });
  const outcome = outcomeOrchestrator.createPlan({
    currentMissionType: authority.priorityResult.missionType,
    signals: authority.bottleneckSignals as Partial<BottleneckSignals> | null,
    sourceAvailable: Boolean(authority.bottleneckSignals),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-8">
      <BeginnerJourneyView
        activation={activation}
        authority={authority}
        outcome={outcome}
      />
    </div>
  );
}
