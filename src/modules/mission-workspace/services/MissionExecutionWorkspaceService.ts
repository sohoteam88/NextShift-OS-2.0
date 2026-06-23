import type { AuthUser } from '@/modules/auth/services/auth-service';
import { missionEngineAuthorityService } from '@/modules/mission-engine/services/MissionEngineAuthorityService';
import { missionService } from '@/modules/mission/services/mission-service';
import type { WorkforcePlan } from '@/modules/agent-workforce/contracts/AgentWorkforce';
import { workforceOrchestrator } from '@/modules/agent-workforce/services/WorkforceOrchestrator';
import type { BusinessOutcome } from '@/modules/mission-engine/services/OutcomeOrchestrator';
import { outcomeOrchestrator } from '@/modules/mission-engine/services/OutcomeOrchestrator';
import type { BottleneckSignals } from '@/modules/mission-engine/services/BottleneckEngine';
import type { FirstUserExperienceProjection } from '@/modules/product-experience/services/FirstUserExperienceService';
import { firstUserExperienceService } from '@/modules/product-experience/services/FirstUserExperienceService';
import type {
  MissionCompletionResult,
  MissionLifecycleStatus,
  MissionPlan,
  MissionType,
} from '@/modules/mission-engine/contracts/MissionAuthority';
import type { MissionStep } from '@/modules/mission-engine/contracts/MissionAuthority';
import { getWorkspaceStepCheckKey } from './MissionCheckRegistry';
import { missionAgentAssistanceService, type ExecutionAgent } from './MissionAgentAssistanceService';

export type MissionStepState = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
export type WorkspaceVerificationStatus = 'PENDING' | 'VERIFYING' | 'COMPLETED' | 'BLOCKED' | 'FAILED';
export type GeneratedAssetStatus = 'DRAFT' | 'READY' | 'APPROVED' | 'ARCHIVED';
export type WorkspaceAssetStatus = 'ready' | 'missing' | 'generated' | GeneratedAssetStatus;

export type MissionWorkspaceStep = MissionStep & {
  state: MissionStepState;
  stepCheckKey: string;
};

export type MissionWorkspaceAsset = {
  id: string;
  title: string;
  description: string;
  status: WorkspaceAssetStatus;
  assetType?: string;
  content?: string;
  preview?: string;
  checkKey?: string;
  route?: string;
  generatedBy?: string;
  sourceAgentId?: string;
  agentActionId?: string;
  missionId?: string;
  createdAt?: string;
  updatedAt?: string;
  outputLevel?: 'DESCRIPTOR' | 'DRAFT_ASSET' | 'PRODUCTION_ASSET';
};

export type MissionExecutionWorkspace = {
  missionId: string;
  objective: string;
  description: string;
  estimatedTime: number;
  missionType: MissionType;
  priority: string;
  currentStatus: MissionLifecycleStatus;
  sourceRoute: string;
  progress: {
    completionPercentage: number;
    currentStep: MissionWorkspaceStep | null;
    completedSteps: number;
    remainingSteps: number;
  };
  steps: MissionWorkspaceStep[];
  requiredAssets: MissionWorkspaceAsset[];
  generatedAssets: MissionWorkspaceAsset[];
  firstUserExperience: FirstUserExperienceProjection;
  businessOutcome: BusinessOutcome;
  workforcePlan: WorkforcePlan;
  agentSupport: ExecutionAgent[];
  recommendedAgent: ExecutionAgent | null;
  completion: MissionCompletionResult;
  verificationStatus: WorkspaceVerificationStatus;
  nextMilestone: string;
};

function missionWorkspaceRoute(missionId: string) {
  return `/mission/${encodeURIComponent(missionId)}`;
}

function verificationStatusFor(input: {
  lifecycle: MissionLifecycleStatus;
  completion: MissionCompletionResult;
}): WorkspaceVerificationStatus {
  if (input.completion.completed) return 'COMPLETED';
  if (input.completion.verificationStatus === 'VERIFYING') return 'VERIFYING';
  if (input.lifecycle === 'FAILED') return 'FAILED';
  if (input.completion.verificationStatus === 'BLOCKED') return 'BLOCKED';
  return 'PENDING';
}

function assetStatus(completion: MissionCompletionResult, checkKey: string): WorkspaceAssetStatus {
  return completion.passedChecks.includes(checkKey) ? 'ready' : 'missing';
}

function requiredAssetsFor(plan: MissionPlan, completion: MissionCompletionResult): MissionWorkspaceAsset[] {
  const assets: Partial<Record<MissionType, Array<Omit<MissionWorkspaceAsset, 'status'>>>> = {
    BRAND: [
      { id: 'business-profile', title: 'Business Profile', description: 'Core business context captured from the AI Interview.', checkKey: 'businessProfile.exists', route: plan.route },
      { id: 'ai-interview', title: 'AI Interview', description: 'Completed interview answers for mission analysis.', checkKey: 'aiInterview.completed', route: plan.route },
    ],
    POSITIONING: [
      { id: 'audience', title: 'Target Audience', description: 'Defined audience segment and pain point.', checkKey: 'audience.defined', route: plan.route },
      { id: 'positioning', title: 'Positioning Statement', description: 'Confirmed market position and promise.', checkKey: 'positioning.confirmed', route: plan.route },
      { id: 'cta', title: 'Primary CTA', description: 'Confirmed next action for prospects.', checkKey: 'cta.confirmed', route: plan.route },
    ],
    CONTENT: [
      { id: 'content-draft', title: 'Content Draft', description: 'A useful content asset has been drafted.', checkKey: 'content.draftCreated', route: plan.route },
      { id: 'published-content', title: 'Published Content', description: 'Content is published or scheduled in the active channel.', checkKey: 'content.published', route: plan.route },
    ],
    LEAD_MAGNET: [
      { id: 'lead-magnet-asset', title: 'Lead Magnet Asset', description: 'The opt-in asset exists.', checkKey: 'leadMagnet.exists', route: plan.route },
      { id: 'lead-magnet-published', title: 'Published Lead Magnet', description: 'The asset is available to prospects.', checkKey: 'leadMagnet.published', route: plan.route },
      { id: 'cta-active', title: 'Active CTA', description: 'The lead magnet is connected to a call to action.', checkKey: 'cta.active', route: plan.route },
    ],
    FUNNEL: [
      { id: 'landing-page', title: 'Landing Page', description: 'The funnel landing page is published.', checkKey: 'landingPage.published', route: plan.route },
      { id: 'thank-you-page', title: 'Thank You Page', description: 'The post opt-in path is published.', checkKey: 'thankYouPage.published', route: plan.route },
      { id: 'lead-route', title: 'Lead Route', description: 'Lead submissions route into follow-up.', checkKey: 'leadRoute.active', route: plan.route },
    ],
    TRAFFIC: [
      { id: 'traffic-source', title: 'Traffic Source', description: 'At least one measurable traffic source is active.', checkKey: 'trafficSource.active', route: plan.route },
      { id: 'tracking', title: 'Tracking', description: 'Traffic and conversion tracking are available.', checkKey: 'tracking.active', route: plan.route },
    ],
    CUSTOMERS: [
      { id: 'lead-follow-up', title: 'Lead Follow-Up', description: 'A qualified lead has been followed up.', checkKey: 'lead.followUpCompleted', route: plan.route },
      { id: 'customer-opportunity', title: 'Customer Opportunity', description: 'The opportunity or customer outcome is recorded.', checkKey: 'customerOpportunity.updated', route: plan.route },
    ],
    RETENTION: [
      { id: 'retention-path', title: 'Retention Path', description: 'A repeat purchase or customer success path is active.', checkKey: 'retentionPath.active', route: plan.route },
      { id: 'customer-follow-up', title: 'Customer Follow-Up', description: 'Customer response or next follow-up is recorded.', checkKey: 'customerFollowUp.recorded', route: plan.route },
    ],
    TEAM: [
      { id: 'sop', title: 'SOP', description: 'A repeatable operating procedure exists.', checkKey: 'sop.created', route: plan.route },
      { id: 'execution-owner', title: 'Execution Owner', description: 'A person or AI agent owns the execution.', checkKey: 'executionOwner.assigned', route: plan.route },
    ],
    OPTIMIZATION: [
      { id: 'optimization-result', title: 'Optimization Result', description: 'The selected growth experiment has a recorded outcome.', checkKey: 'optimization.completed', route: plan.route },
    ],
    SYSTEM: [
      { id: 'business-signals', title: 'Business Signals', description: 'Required signals are available for reliable next-step recommendations.', checkKey: 'signals.available', route: plan.route },
    ],
  };

  return (assets[plan.missionType] ?? []).map((asset) => ({
    ...asset,
    status: asset.checkKey ? assetStatus(completion, asset.checkKey) : 'missing',
  }));
}

function generatedAssetsFor(plan: MissionPlan, completion: MissionCompletionResult): MissionWorkspaceAsset[] {
  const generated = plan.steps.slice(0, 3).map((step, index) => ({
    id: `generated-${index + 1}`,
    title: step.title,
    description: step.description,
    status: index < completion.passedChecks.length ? 'generated' as const : 'missing' as const,
    route: plan.route,
  }));

  return generated.length > 0 ? generated : [{
    id: 'mission-output',
    title: plan.objective,
    description: 'Mission output generated during execution.',
    status: completion.completed ? 'generated' : 'missing',
    route: plan.route,
  }];
}

export async function getMissionExecutionWorkspace(user: AuthUser, missionId: string): Promise<MissionExecutionWorkspace> {
  const [authority, missionState] = await Promise.all([
    missionEngineAuthorityService.getCurrentMission(user.id),
    missionService.getState(user),
  ]);
  const plan = authority.missionPlan;

  if (missionId !== plan.id) {
    throw new Error('MISSION_WORKSPACE_NOT_FOUND');
  }

  const completedStepKeys = new Set(missionState.completedChecks);
  const initialSteps = plan.steps.map((step, index): MissionWorkspaceStep => {
    const key = getWorkspaceStepCheckKey(plan, step, index);
    return {
      ...step,
      stepCheckKey: key,
      state: completedStepKeys.has(key) ? 'COMPLETED' : 'NOT_STARTED',
    };
  });
  const completedSteps = initialSteps.filter((step) => step.state === 'COMPLETED').length;
  const allStepsCompleted = completedSteps === initialSteps.length;
  const steps = initialSteps.map((step, index): MissionWorkspaceStep => {
    if (step.state === 'COMPLETED') return step;
    if (allStepsCompleted && !authority.missionCompletion.completed) return { ...step, state: 'BLOCKED' };
    if (index === completedSteps) return { ...step, state: 'IN_PROGRESS' };
    return step;
  });
  const currentStep = steps.find((step) => step.state === 'IN_PROGRESS' || step.state === 'BLOCKED') ?? null;
  const baseAgentSupport = missionAgentAssistanceService.getAgentsForMission(plan);
  const agentGeneratedAssets = await missionAgentAssistanceService.readGeneratedAssets({
    user,
    missionId: plan.id,
  });
  const workforcePlan = workforceOrchestrator.createPlan({
    plan,
    generatedAssets: agentGeneratedAssets,
    requestedBy: user.id,
  });
  const businessOutcome = outcomeOrchestrator.createPlan({
    currentMissionType: plan.missionType,
    signals: authority.bottleneckSignals as Partial<BottleneckSignals> | null | undefined,
    sourceAvailable: authority.missionCompletion.verificationSource !== 'unavailable',
  });
  await outcomeOrchestrator.ensureAudit({
    user,
    outcome: businessOutcome,
  });
  await workforceOrchestrator.ensurePlanAudit({
    user,
    workforcePlan,
  });
  const agentSupport = baseAgentSupport.map((agent) => ({
    ...agent,
    status: agentGeneratedAssets.some((asset) => asset.generatedBy === agent.name) ? 'COMPLETED' as const : agent.status,
  }));

  const workspace: Omit<MissionExecutionWorkspace, 'firstUserExperience'> = {
    missionId: plan.id,
    objective: plan.objective,
    description: plan.description,
    estimatedTime: plan.estimatedTime,
    missionType: plan.missionType,
    priority: authority.priorityAction.priority,
    currentStatus: authority.lifecycle,
    sourceRoute: plan.route,
    progress: {
      completionPercentage: authority.missionCompletion.completionPercentage,
      currentStep,
      completedSteps,
      remainingSteps: Math.max(0, steps.length - completedSteps),
    },
    steps,
    requiredAssets: requiredAssetsFor(plan, authority.missionCompletion),
    generatedAssets: [...agentGeneratedAssets, ...generatedAssetsFor(plan, authority.missionCompletion)],
    businessOutcome,
    workforcePlan,
    agentSupport,
    recommendedAgent: agentSupport[0] ?? null,
    completion: authority.missionCompletion,
    verificationStatus: verificationStatusFor({
      lifecycle: authority.lifecycle,
      completion: authority.missionCompletion,
    }),
    nextMilestone: plan.nextMilestone,
  };

  return {
    ...workspace,
    firstUserExperience: firstUserExperienceService.buildForWorkspace({
      workspace,
    }),
  };
}

export const missionExecutionWorkspaceService = {
  getWorkspace: getMissionExecutionWorkspace,
  missionWorkspaceRoute,
};
