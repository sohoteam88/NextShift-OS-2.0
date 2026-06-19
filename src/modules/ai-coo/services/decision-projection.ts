import type { JourneyState } from '@/modules/journey/contracts/JourneyState';
import type { MissionAuthoritySnapshot } from '@/modules/mission-engine/contracts/MissionAuthority';
import type {
  AICOODecision,
  AICOODecisionAction,
  AICOODecisionPriority,
  AICOODecisionSignal,
  AICOOFocusArea,
} from '../contracts/AICOODecision';

const FOCUS_LABEL: Record<AICOOFocusArea, string> = {
  activate_user: 'Activate User',
  re_engage_user: 'Re-engage User',
  realize_value: 'Realize Value',
  scale_results: 'Scale Results',
  activate_advocacy: 'Activate Advocacy',
  build_authority: 'Build Authority',
  generate_leads: 'Generate Leads',
  launch_offer: 'Launch Offer',
  improve_conversion: 'Improve Conversion',
  increase_consistency: 'Increase Consistency',
};

function successMetricFor(focusArea: AICOOFocusArea) {
  switch (focusArea) {
    case 'activate_user':
      return 'Reach first win within 15 minutes';
    case 're_engage_user':
      return 'Return and complete one meaningful action';
    case 'realize_value':
      return 'Achieve the next business outcome milestone';
    case 'scale_results':
      return 'Multiply the strongest proven growth lever';
    case 'activate_advocacy':
      return 'Activate the highest-probability referral opportunity';
    case 'build_authority':
      return 'Publish one clear authority asset';
    case 'generate_leads':
      return 'Capture the first qualified lead';
    case 'launch_offer':
      return 'Define and publish the primary offer';
    case 'improve_conversion':
      return 'Increase lead-to-customer conversion';
    case 'increase_consistency':
      return 'Complete the current mission without switching focus';
  }
}

function effortFor(minutes: number): AICOODecision['estimatedEffort'] {
  if (minutes <= 15) return 'low';
  if (minutes <= 45) return 'medium';
  return 'high';
}

function confidenceFor(input: {
  primaryRisk: AICOODecisionSignal | null;
  primaryOpportunity: AICOODecisionSignal | null;
  basisType: 'risk' | 'opportunity' | 'mission';
  missionAuthority: MissionAuthoritySnapshot;
}): AICOODecision['confidence'] {
  if (input.primaryRisk?.priority === 'critical' || input.primaryOpportunity?.priority === 'high') return 'high';
  if (input.missionAuthority.confidence === 'fallback') return 'low';
  if (input.basisType === 'mission') return 'medium';
  return 'high';
}

function buildAction(input: {
  missionAuthority: MissionAuthoritySnapshot;
  focusArea: AICOOFocusArea;
  reason: string;
}): AICOODecisionAction {
  const mission = input.missionAuthority.currentMission;

  return {
    id: `decision-action-${mission.id}`,
    title: mission.title,
    reason: input.reason,
    route: mission.route,
    successMetric: successMetricFor(input.focusArea),
  };
}

function supportingActions(input: {
  risks: AICOODecisionSignal[];
  opportunities: AICOODecisionSignal[];
  journeyState: JourneyState;
  primaryAction: AICOODecisionAction;
}): AICOODecisionAction[] {
  const actions: AICOODecisionAction[] = [];

  for (const risk of input.risks.slice(0, 2)) {
    actions.push({
      id: `support-risk-${risk.code}`,
      title: risk.title,
      reason: risk.reason,
      successMetric: `Reduce ${risk.title}`,
    });
  }

  for (const opportunity of input.opportunities.slice(0, 2)) {
    actions.push({
      id: `support-opportunity-${opportunity.code}`,
      title: opportunity.title,
      reason: opportunity.reason,
      successMetric: `Activate ${opportunity.title}`,
    });
  }

  actions.push({
    id: `support-journey-${input.journeyState.stage}`,
    title: input.journeyState.nextAction.title,
    reason: input.journeyState.nextAction.description,
    route: input.journeyState.nextAction.route,
    successMetric: 'Advance the current journey stage',
  });

  return actions
    .filter((action) => action.id !== input.primaryAction.id)
    .filter((action, index, array) => array.findIndex((item) => item.id === action.id) === index)
    .slice(0, 3);
}

export function buildDecisionProjection(input: {
  userId: string;
  focusArea: AICOOFocusArea;
  basis: AICOODecisionSignal | null;
  basisType: 'risk' | 'opportunity' | 'mission';
  risks: AICOODecisionSignal[];
  opportunities: AICOODecisionSignal[];
  journeyState: JourneyState;
  missionAuthority: MissionAuthoritySnapshot;
}): AICOODecision {
  const primaryRisk = input.risks[0] ?? null;
  const primaryOpportunity = input.opportunities[0] ?? null;
  const focusLabel = FOCUS_LABEL[input.focusArea];
  const mission = input.missionAuthority.currentMission;
  const reason =
    input.basis
      ? input.basis.reason
      : `The current mission is the clearest next step for ${input.journeyState.stage}.`;
  const recommendedAction = buildAction({
    missionAuthority: input.missionAuthority,
    focusArea: input.focusArea,
    reason,
  });
  const priority: AICOODecisionPriority = input.basis?.priority ?? (mission.priority >= 80 ? 'high' : 'medium');

  return {
    decisionId: `coo-decision-${input.userId}-${input.focusArea}-${input.basis?.code ?? mission.id}`,
    focusArea: input.focusArea,
    currentFocus: focusLabel,
    reason,
    priority,
    confidence: confidenceFor({
      primaryRisk,
      primaryOpportunity,
      basisType: input.basisType,
      missionAuthority: input.missionAuthority,
    }),
    estimatedImpact: priority === 'critical' || priority === 'high' ? 'high' : 'medium',
    estimatedEffort: effortFor(mission.estimatedMinutes),
    recommendedAction,
    nextBestAction: recommendedAction,
    successMetric: recommendedAction.successMetric,
    primaryRisk,
    primaryOpportunity,
    recommendedMission: {
      id: mission.id,
      title: mission.title,
      route: mission.route,
    },
    decisionReason: [
      `Primary focus: ${focusLabel}.`,
      `Why now: ${reason}`,
      input.basisType === 'risk'
        ? 'Why not something else: unresolved risk has priority over new growth work.'
        : input.basisType === 'opportunity'
          ? 'Why not something else: the strongest opportunity is ready to activate now.'
          : 'Why not something else: there is no stronger risk or opportunity than the current mission.',
    ].join(' '),
    supportingActions: supportingActions({
      risks: input.risks,
      opportunities: input.opportunities,
      journeyState: input.journeyState,
      primaryAction: recommendedAction,
    }),
  };
}
