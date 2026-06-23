import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { activationEngine } from '@/modules/activation/services/activation-engine';
import { businessStateService } from '@/modules/business-state/services/BusinessStateService';
import { OnboardingActivationOverview } from '@/modules/member/components/OnboardingActivationOverview';
import type { ExplainabilityLocale } from '@/modules/mission-engine/contracts/MissionAuthority';
import { missionEngineAuthorityService } from '@/modules/mission-engine/services/MissionEngineAuthorityService';
import { firstUserExperienceService } from '@/modules/product-experience/services/FirstUserExperienceService';

export default async function OnboardingIndexPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const locale = (await getLocale()) as ExplainabilityLocale;
  const [activation, businessState] = await Promise.all([
    activationEngine.getProjection(user.id, user.tenantId),
    businessStateService.getBusinessState(user.id),
  ]);
  const authority = await missionEngineAuthorityService.getCurrentMission(user.id, {
    businessState: businessState.stateResult,
    locale,
  });
  const firstUserExperience = firstUserExperienceService.buildForDashboard({
    activation,
    missionControl: {
      ctaLabel: authority.priorityAction.ctaLabel,
      route: authority.missionPlan.route,
      progress: authority.missionCompletion.completionPercentage,
      nextMilestone: authority.explainability.nextMilestone,
      expectedOutcome: authority.explainability.expectedOutcome,
    },
  });

  return (
    <OnboardingActivationOverview
      activation={activation}
      firstUserExperience={firstUserExperience}
    />
  );
}
