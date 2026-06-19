import {
  getNextJourneyAction,
  type JourneyNextAction as LegacyJourneyNextAction,
} from '@/modules/journey/utils/getNextJourneyAction';
import {
  resolveJourneyCompletion,
  toJourneyNextActionInput,
} from '@/modules/journey/services/JourneyCompletionResolver';
import type { JourneyNextAction } from '../contracts/JourneyNextAction';
import { metadataFor, readJourneyProgress } from './journey-adapter-diagnostics';

function actionTypeFromRoute(route: string): JourneyNextAction['actionType'] {
  if (route.includes('content')) return 'content';
  if (route.includes('crm') || route.includes('whatsapp')) return 'crm';
  if (route.includes('brand-builder') || route.includes('team')) return 'setup';
  if (route.includes('journey')) return 'navigation';
  return 'mission';
}

function mapLegacyAction(action: LegacyJourneyNextAction, metadata: ReturnType<typeof metadataFor>): JourneyNextAction {
  return {
    ...metadata,
    title: action.title,
    description: action.description,
    route: action.route,
    actionType: actionTypeFromRoute(action.route),
  };
}

export async function adaptJourneyNextAction(userId: string): Promise<JourneyNextAction> {
  const progress = await readJourneyProgress(userId);
  const metadata = metadataFor('getNextJourneyAction+userProgress', progress);
  const completion = resolveJourneyCompletion({
    completedChecks: progress.completedChecksValue,
    progressPercent: progress.progressPercent,
  });
  const action = getNextJourneyAction(toJourneyNextActionInput(completion));

  return mapLegacyAction(action, metadata);
}
