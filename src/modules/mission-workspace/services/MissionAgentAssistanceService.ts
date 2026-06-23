import prisma from '@/lib/prisma';
import { AppError } from '@/lib/errors';
import { guardrailEngine } from '@/modules/autonomous-execution/services/guardrail-engine';
import type { AuthUser } from '@/modules/auth/services/auth-service';
import type { MissionPlan, MissionType } from '@/modules/mission-engine/contracts/MissionAuthority';
import { missionEngineAuthorityService } from '@/modules/mission-engine/services/MissionEngineAuthorityService';
import { personalizationEngine, type PersonalizationProfile } from '@/modules/personalization/services/PersonalizationEngine';
import { localizationEngine, type LocalizedGeneratedAsset } from '@/modules/localization/services/LocalizationEngine';
import type { GeneratedAssetStatus, MissionWorkspaceAsset } from './MissionExecutionWorkspaceService';

export type AgentStatus = 'IDLE' | 'WORKING' | 'COMPLETED' | 'FAILED';
export type AgentAssetType =
  | 'CONTENT_ASSET'
  | 'LEAD_MAGNET_ASSET'
  | 'FUNNEL_ASSET'
  | 'TRAFFIC_ASSET'
  | 'WEBINAR_ASSET'
  | 'CRM_ASSET'
  | 'OFFER_ASSET';

export type ExecutionAgentAction = {
  id: string;
  label: string;
  outputType: string;
  assetType: AgentAssetType;
};

export type ExecutionAgent = {
  id: string;
  name: string;
  description: string;
  supportedMissionTypes: MissionType[];
  supportedSteps: string[];
  actions: ExecutionAgentAction[];
  status: AgentStatus;
};

export type AgentInvocationResult = {
  missionId: string;
  missionType: MissionType;
  agentId: string;
  actionId: string;
  status: AgentStatus;
  generatedAsset: MissionWorkspaceAsset;
  executionTimeMs: number;
  verificationBoundary: 'agent_output_not_completion';
  localization: Pick<LocalizedGeneratedAsset, 'locale' | 'translationSource' | 'fallbackUsed'>;
};

export type AssetStatusUpdateResult = {
  missionId: string;
  assetId: string;
  status: GeneratedAssetStatus;
  asset: MissionWorkspaceAsset;
  verificationBoundary: 'asset_approval_not_completion';
};

const EXECUTION_AGENTS: ExecutionAgent[] = [
  {
    id: 'content-agent',
    name: 'Content Agent',
    description: 'Generates, improves, repurposes, captions, and hooks content assets.',
    supportedMissionTypes: ['CONTENT'],
    supportedSteps: ['content.pillar', 'content.generate', 'content.publish'],
    actions: [
      { id: 'generate_content', label: 'Generate Content', outputType: 'Content Draft', assetType: 'CONTENT_ASSET' },
      { id: 'generate_hooks', label: 'Generate Hooks', outputType: 'Hook Set', assetType: 'CONTENT_ASSET' },
      { id: 'repurpose_content', label: 'Repurpose Content', outputType: 'Repurposed Content', assetType: 'CONTENT_ASSET' },
    ],
    status: 'IDLE',
  },
  {
    id: 'lead-magnet-agent',
    name: 'Lead Magnet Agent',
    description: 'Suggests lead magnet types, drafts the asset, improves it, and creates CTA copy.',
    supportedMissionTypes: ['LEAD_MAGNET'],
    supportedSteps: ['leadMagnet.type', 'leadMagnet.content', 'leadMagnet.cta'],
    actions: [
      { id: 'suggest_lead_magnet_type', label: 'Suggest Lead Magnet Type', outputType: 'Lead Magnet Recommendation', assetType: 'LEAD_MAGNET_ASSET' },
      { id: 'generate_lead_magnet', label: 'Generate Lead Magnet', outputType: 'Lead Magnet Draft', assetType: 'LEAD_MAGNET_ASSET' },
      { id: 'generate_cta', label: 'Generate CTA', outputType: 'CTA Draft', assetType: 'LEAD_MAGNET_ASSET' },
    ],
    status: 'IDLE',
  },
  {
    id: 'funnel-agent',
    name: 'Funnel Agent',
    description: 'Creates landing pages, thank-you pages, funnel flow, and funnel reviews.',
    supportedMissionTypes: ['LEAD_MAGNET', 'FUNNEL'],
    supportedSteps: ['leadMagnet.cta', 'funnel.landing', 'funnel.thankYou', 'funnel.route', 'funnel.test'],
    actions: [
      { id: 'create_landing_page', label: 'Create Landing Page', outputType: 'Landing Page Draft', assetType: 'FUNNEL_ASSET' },
      { id: 'create_thank_you_page', label: 'Create Thank You Page', outputType: 'Thank You Page Draft', assetType: 'FUNNEL_ASSET' },
      { id: 'review_funnel', label: 'Review Funnel', outputType: 'Funnel Review', assetType: 'FUNNEL_ASSET' },
    ],
    status: 'IDLE',
  },
  {
    id: 'traffic-agent',
    name: 'Traffic Agent',
    description: 'Recommends traffic sources, strategy, ad angles, and audiences.',
    supportedMissionTypes: ['TRAFFIC'],
    supportedSteps: ['traffic.source', 'traffic.asset', 'traffic.launch', 'traffic.track'],
    actions: [
      { id: 'recommend_traffic_sources', label: 'Traffic Recommendations', outputType: 'Traffic Plan', assetType: 'TRAFFIC_ASSET' },
      { id: 'suggest_ad_angles', label: 'Ad Angle Suggestions', outputType: 'Ad Angle Set', assetType: 'TRAFFIC_ASSET' },
      { id: 'suggest_audiences', label: 'Audience Suggestions', outputType: 'Audience Plan', assetType: 'TRAFFIC_ASSET' },
    ],
    status: 'IDLE',
  },
  {
    id: 'webinar-agent',
    name: 'Webinar Agent',
    description: 'Generates webinar decks, speaker scripts, offer stacks, Q&A handling, and follow-up assets.',
    supportedMissionTypes: ['WEBINAR'],
    supportedSteps: ['webinar.strategy', 'webinar.deck', 'webinar.script', 'webinar.offer', 'webinar.followUp'],
    actions: [
      { id: 'generate_webinar_deck', label: 'Generate Webinar Deck', outputType: 'Webinar Deck', assetType: 'WEBINAR_ASSET' },
      { id: 'generate_speaker_script', label: 'Generate Speaker Script', outputType: 'Speaker Script', assetType: 'WEBINAR_ASSET' },
      { id: 'generate_offer_stack', label: 'Generate Offer Stack', outputType: 'Offer Stack', assetType: 'WEBINAR_ASSET' },
      { id: 'generate_webinar_follow_up', label: 'Generate Webinar Follow-Up', outputType: 'Webinar Follow-Up', assetType: 'WEBINAR_ASSET' },
      { id: 'generate_webinar_qa', label: 'Generate Webinar Q&A', outputType: 'Webinar Q&A', assetType: 'WEBINAR_ASSET' },
    ],
    status: 'IDLE',
  },
  {
    id: 'crm-agent',
    name: 'CRM Agent',
    description: 'Creates follow-up scripts, customer segmentation, and retention suggestions.',
    supportedMissionTypes: ['CUSTOMERS', 'RETENTION'],
    supportedSteps: ['customers.review', 'customers.offer', 'customers.followUp', 'retention.segment', 'retention.path'],
    actions: [
      { id: 'follow_up_script', label: 'Follow-Up Scripts', outputType: 'Follow-Up Script', assetType: 'CRM_ASSET' },
      { id: 'customer_segmentation', label: 'Customer Segmentation', outputType: 'Customer Segment Plan', assetType: 'CRM_ASSET' },
      { id: 'retention_suggestions', label: 'Retention Suggestions', outputType: 'Retention Plan', assetType: 'CRM_ASSET' },
    ],
    status: 'IDLE',
  },
  {
    id: 'offer-agent',
    name: 'Offer Agent',
    description: 'Reviews offers, improves offers, analyzes objections, and suggests pricing.',
    supportedMissionTypes: ['POSITIONING', 'CUSTOMERS', 'OPTIMIZATION'],
    supportedSteps: ['positioning.promise', 'customers.offer', 'optimization.select'],
    actions: [
      { id: 'offer_review', label: 'Offer Review', outputType: 'Offer Review', assetType: 'OFFER_ASSET' },
      { id: 'offer_improvement', label: 'Offer Improvement', outputType: 'Offer Improvement Plan', assetType: 'OFFER_ASSET' },
      { id: 'objection_analysis', label: 'Objection Analysis', outputType: 'Objection Analysis', assetType: 'OFFER_ASSET' },
    ],
    status: 'IDLE',
  },
];

function metadataRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function nowIso() {
  return new Date().toISOString();
}

export function getExecutionAgentsForMission(plan: MissionPlan): ExecutionAgent[] {
  return EXECUTION_AGENTS
    .filter((agent) => agent.supportedMissionTypes.includes(plan.missionType))
    .map((agent, index) => ({ ...agent, status: index === 0 ? 'IDLE' : agent.status }));
}

function assetFor(input: {
  plan: MissionPlan;
  agent: ExecutionAgent;
  action: ExecutionAgentAction;
  personalizationProfile: PersonalizationProfile;
}): { asset: MissionWorkspaceAsset; localization: LocalizedGeneratedAsset } {
  const createdAt = nowIso();
  const title = `${input.action.outputType}: ${input.plan.objective}`;
  const personalizedContent = personalizationEngine.buildAssetContent({
    profile: input.personalizationProfile,
    plan: input.plan,
    assetType: input.action.assetType,
    actionLabel: input.action.label,
  });
  const localeResolution = localizationEngine.resolveLocale({
    userPreference: input.personalizationProfile.businessContext.language,
    systemDefault: 'en',
  });
  const localization = localizationEngine.localizeGeneratedAsset({
    title,
    content: personalizedContent,
    locale: localeResolution.locale,
    assetType: input.action.assetType,
  });

  return {
    asset: {
      id: `agent-${input.agent.id}-${input.action.id}-${Date.now()}`,
      assetType: input.action.assetType,
      title: localization.title,
      description: localizationEngine.assetDescription(input.agent.name, localization.locale).value,
      content: localization.content,
      preview: localization.preview,
      status: 'DRAFT',
      route: input.plan.route,
      generatedBy: input.agent.name,
      sourceAgentId: input.agent.id,
      agentActionId: input.action.id,
      missionId: input.plan.id,
      createdAt,
      updatedAt: createdAt,
      outputLevel: 'DRAFT_ASSET',
    },
    localization,
  };
}

async function writeAudit(input: {
  user: AuthUser;
  action:
    | 'mission_agent.invoked'
    | 'agent.asset.generated'
    | 'agent.asset.updated'
    | 'agent.asset.approved'
    | 'agent.asset.archived';
  missionId: string;
  missionType: MissionType;
  agentId: string;
  actionId: string;
  generatedAsset?: MissionWorkspaceAsset;
  personalizationProfile?: PersonalizationProfile;
  localization?: Pick<LocalizedGeneratedAsset, 'locale' | 'translationSource' | 'fallbackUsed'>;
  executionTimeMs?: number;
}) {
  await prisma.auditLog.create({
    data: {
      tenantId: input.user.tenantId,
      actorId: input.user.id,
      action: input.action,
      targetType: 'mission_agent',
      metadata: {
        missionId: input.missionId,
        missionType: input.missionType,
        agentId: input.agentId,
        actionId: input.actionId,
        assetId: input.generatedAsset?.id,
        assetType: input.generatedAsset?.assetType,
        generatedAsset: input.generatedAsset,
        personalization: input.personalizationProfile ? {
          identity: input.personalizationProfile.brandDNA.identity,
          audience: input.personalizationProfile.audience.primaryAudience,
          offer: input.personalizationProfile.offer.primaryOffer,
          language: input.personalizationProfile.businessContext.language,
          assetHistoryCount: input.personalizationProfile.assetHistory.titles.length,
          internalScore: input.personalizationProfile.internalScore,
          verificationBoundary: input.personalizationProfile.verificationBoundary,
        } : undefined,
        localization: input.localization ? {
          locale: input.localization.locale,
          translationSource: input.localization.translationSource,
          fallbackUsed: input.localization.fallbackUsed,
        } : undefined,
        executionTimeMs: input.executionTimeMs,
        verificationBoundary: 'agent_output_not_completion',
        timestamp: new Date().toISOString(),
      },
    },
  });
}

export async function invokeMissionAgent(input: {
  user: AuthUser;
  missionId: string;
  agentId: string;
  actionId: string;
}): Promise<AgentInvocationResult> {
  const startedAt = Date.now();
  const authority = await missionEngineAuthorityService.getCurrentMission(input.user.id);
  const plan = authority.missionPlan;
  if (input.missionId !== plan.id) {
    throw new AppError('MISSION_WORKSPACE_NOT_FOUND', 404, 'Mission workspace not found.');
  }

  const agent = getExecutionAgentsForMission(plan).find((item) => item.id === input.agentId);
  if (!agent) {
    throw new AppError('INVALID_AGENT_FOR_MISSION', 400, 'The supplied agent does not support the active mission.');
  }

  const action = agent.actions.find((item) => item.id === input.actionId);
  if (!action) {
    throw new AppError('INVALID_AGENT_ACTION', 400, 'The supplied agent action is not available for the active mission.');
  }
  const guardrail = guardrailEngine.evaluate({
    action: action.id,
    requestedBy: input.user.id,
    affectedResources: [plan.id, plan.route],
  });
  if (!guardrail.allowed || guardrail.approvalRequired) {
    await guardrailEngine.writeAudit({
      tenantId: input.user.tenantId,
      actorId: input.user.id,
      action: 'agent.action.blocked',
      guardrail,
    });
    throw new AppError('AGENT_ACTION_BLOCKED', 403, guardrail.reason);
  }

  await writeAudit({
    user: input.user,
    action: 'mission_agent.invoked',
    missionId: plan.id,
    missionType: plan.missionType,
    agentId: agent.id,
    actionId: action.id,
  });

  const personalizationProfile = await personalizationEngine.buildProfile({
    user: input.user,
    plan,
  });
  const { asset: generatedAsset, localization } = assetFor({ plan, agent, action, personalizationProfile });
  const executionTimeMs = Math.max(1, Date.now() - startedAt);

  await writeAudit({
    user: input.user,
    action: 'agent.asset.generated',
    missionId: plan.id,
    missionType: plan.missionType,
    agentId: agent.id,
    actionId: action.id,
    generatedAsset,
    personalizationProfile,
    localization,
    executionTimeMs,
  });

  return {
    missionId: plan.id,
    missionType: plan.missionType,
    agentId: agent.id,
    actionId: action.id,
    status: 'COMPLETED',
    generatedAsset,
    executionTimeMs,
    verificationBoundary: 'agent_output_not_completion',
    localization: {
      locale: localization.locale,
      translationSource: localization.translationSource,
      fallbackUsed: localization.fallbackUsed,
    },
  };
}

export async function readAgentGeneratedAssets(input: {
  user: AuthUser;
  missionId: string;
}): Promise<MissionWorkspaceAsset[]> {
  try {
    const rows = await prisma.auditLog.findMany({
      where: {
        tenantId: input.user.tenantId,
        actorId: input.user.id,
        action: {
          in: [
            'agent.asset.generated',
            'agent.asset.updated',
            'agent.asset.approved',
            'agent.asset.archived',
            'mission_agent.asset_generated',
          ],
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: { metadata: true },
    });
    const latestByAssetId = new Map<string, MissionWorkspaceAsset>();

    for (const row of rows) {
      const metadata = metadataRecord(row.metadata);
      if (metadata.missionId !== input.missionId) continue;
      const parsed = parseGeneratedAsset(metadata.generatedAsset);
      if (!parsed || latestByAssetId.has(parsed.id)) continue;
      latestByAssetId.set(parsed.id, parsed);
    }

    return Array.from(latestByAssetId.values()).filter((asset) => asset.status !== 'ARCHIVED');
  } catch {
    return [];
  }
}

function generatedStatus(value: unknown): GeneratedAssetStatus {
  return value === 'READY' || value === 'APPROVED' || value === 'ARCHIVED' ? value : 'DRAFT';
}

function parseGeneratedAsset(value: unknown): MissionWorkspaceAsset | null {
  const asset = metadataRecord(value);
  const title = typeof asset.title === 'string' ? asset.title : '';
  const description = typeof asset.description === 'string' ? asset.description : '';
  if (!title || !description) return null;

  return {
    id: typeof asset.id === 'string' ? asset.id : `agent-asset-${title}`,
    title,
    description,
    status: generatedStatus(asset.status),
    assetType: typeof asset.assetType === 'string' ? asset.assetType : undefined,
    content: typeof asset.content === 'string' ? asset.content : undefined,
    preview: typeof asset.preview === 'string' ? asset.preview : undefined,
    route: typeof asset.route === 'string' ? asset.route : undefined,
    generatedBy: typeof asset.generatedBy === 'string' ? asset.generatedBy : undefined,
    sourceAgentId: typeof asset.sourceAgentId === 'string' ? asset.sourceAgentId : undefined,
    agentActionId: typeof asset.agentActionId === 'string' ? asset.agentActionId : undefined,
    missionId: typeof asset.missionId === 'string' ? asset.missionId : undefined,
    createdAt: typeof asset.createdAt === 'string' ? asset.createdAt : undefined,
    updatedAt: typeof asset.updatedAt === 'string' ? asset.updatedAt : undefined,
    outputLevel: asset.outputLevel === 'PRODUCTION_ASSET' || asset.outputLevel === 'DESCRIPTOR' ? asset.outputLevel : 'DRAFT_ASSET',
  };
}

export async function updateAgentGeneratedAssetStatus(input: {
  user: AuthUser;
  missionId: string;
  assetId: string;
  status: Extract<GeneratedAssetStatus, 'READY' | 'APPROVED' | 'ARCHIVED'>;
}): Promise<AssetStatusUpdateResult> {
  const authority = await missionEngineAuthorityService.getCurrentMission(input.user.id);
  const plan = authority.missionPlan;
  if (input.missionId !== plan.id) {
    throw new AppError('MISSION_WORKSPACE_NOT_FOUND', 404, 'Mission workspace not found.');
  }

  const assets = await readAgentGeneratedAssets({
    user: input.user,
    missionId: input.missionId,
  });
  const current = assets.find((asset) => asset.id === input.assetId);
  if (!current) {
    throw new AppError('AGENT_ASSET_NOT_FOUND', 404, 'Generated asset not found.');
  }

  const updatedAsset: MissionWorkspaceAsset = {
    ...current,
    status: input.status,
    updatedAt: nowIso(),
  };
  const action = input.status === 'APPROVED'
    ? 'agent.asset.approved'
    : input.status === 'ARCHIVED'
      ? 'agent.asset.archived'
      : 'agent.asset.updated';

  await writeAudit({
    user: input.user,
    action,
    missionId: plan.id,
    missionType: plan.missionType,
    agentId: updatedAsset.sourceAgentId ?? updatedAsset.generatedBy ?? 'unknown-agent',
    actionId: updatedAsset.agentActionId ?? 'unknown-action',
    generatedAsset: updatedAsset,
  });

  return {
    missionId: plan.id,
    assetId: input.assetId,
    status: input.status,
    asset: updatedAsset,
    verificationBoundary: 'asset_approval_not_completion',
  };
}

export const missionAgentAssistanceService = {
  getAgentsForMission: getExecutionAgentsForMission,
  invokeAgent: invokeMissionAgent,
  readGeneratedAssets: readAgentGeneratedAssets,
  updateGeneratedAssetStatus: updateAgentGeneratedAssetStatus,
};
