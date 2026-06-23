import { businessStateService } from '@/modules/business-state/services/BusinessStateService';
import { missionEngineAuthorityService } from '@/modules/mission-engine/services/MissionEngineAuthorityService';
import type { JourneyNextAction } from '../contracts/JourneyNextAction';
import { metadataFor, readJourneyProgress } from './journey-adapter-diagnostics';

function actionTypeFromRoute(route: string): JourneyNextAction['actionType'] {
  if (route.includes('content')) return 'content';
  if (route.includes('crm') || route.includes('whatsapp')) return 'crm';
  if (route.includes('brand-builder') || route.includes('team')) return 'setup';
  if (route.includes('journey')) return 'navigation';
  return 'mission';
}

export async function adaptJourneyNextAction(userId: string): Promise<JourneyNextAction> {
  const [progress, businessState] = await Promise.all([
    readJourneyProgress(userId),
    businessStateService.getBusinessState(userId),
  ]);
  const metadata = metadataFor('MissionAuthority+OutcomeProjection', progress);
  const authority = await missionEngineAuthorityService.getCurrentMission(userId, {
    businessState: businessState.stateResult,
  });

  return {
    ...metadata,
    title: authority.priorityAction.title,
    description: authority.missionPlan.description,
    route: authority.priorityAction.route,
    actionType: actionTypeFromRoute(authority.priorityAction.route),
  };
}
