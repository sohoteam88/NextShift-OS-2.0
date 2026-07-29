import { runAuditBestEffort, writeAuditIfMissing } from '@/lib/audit-log-writer';
import type { AuthUser } from '@/modules/auth/services/auth-service';
import { guardrailEngine } from '@/modules/autonomous-execution/services/guardrail-engine';
import type { MissionPlan, MissionType } from '@/modules/mission-engine/contracts/MissionAuthority';
import type { MissionWorkspaceAsset } from '@/modules/mission-workspace/services/MissionExecutionWorkspaceService';
import type {
  WorkforceAgentType,
  WorkforceAssignmentQueueState,
  WorkforceMode,
  WorkforcePlan,
  WorkforcePlanAssignment,
} from '../contracts/AgentWorkforce';
import { WORKFORCE_AGENT_REGISTRY } from './agent-registry';

type WorkforceTemplateAssignment = {
  agentType: WorkforceAgentType;
  actionId: string;
  task: string;
  assetType: string;
  dependsOn?: WorkforceAgentType[];
  guardrailAction: string;
};

export const WORKFORCE_AUDIT_ACTIONS = {
  planCreated: 'workforce.plan.created',
  assignmentStarted: 'workforce.assignment.started',
  assignmentCompleted: 'workforce.assignment.completed',
  assignmentFailed: 'workforce.assignment.failed',
  assignmentBlocked: 'workforce.assignment.blocked',
  assetHandoffCompleted: 'asset.handoff.completed',
} as const;

const WORKFORCE_TEMPLATES: Partial<Record<MissionType, WorkforceTemplateAssignment[]>> = {
  LEAD_MAGNET: [
    {
      agentType: 'lead_magnet_agent',
      actionId: 'generate_lead_magnet',
      task: 'Create the lead magnet draft asset.',
      assetType: 'LEAD_MAGNET_ASSET',
      guardrailAction: 'LEAD_MAGNET_GENERATION',
    },
    {
      agentType: 'funnel_agent',
      actionId: 'create_landing_page',
      task: 'Turn the lead magnet into a funnel and CTA path.',
      assetType: 'FUNNEL_ASSET',
      dependsOn: ['lead_magnet_agent'],
      guardrailAction: 'FUNNEL_GENERATION',
    },
    {
      agentType: 'crm_agent',
      actionId: 'follow_up_script',
      task: 'Prepare follow-up and CRM handoff for captured leads.',
      assetType: 'CRM_ASSET',
      dependsOn: ['funnel_agent'],
      guardrailAction: 'CRM_UPDATE',
    },
  ],
  CONTENT: [
    {
      agentType: 'content_agent',
      actionId: 'generate_content',
      task: 'Generate the core content draft.',
      assetType: 'CONTENT_ASSET',
      guardrailAction: 'CONTENT_GENERATION',
    },
    {
      agentType: 'traffic_agent',
      actionId: 'recommend_traffic_sources',
      task: 'Prepare distribution and traffic recommendations for the content.',
      assetType: 'TRAFFIC_ASSET',
      dependsOn: ['content_agent'],
      guardrailAction: 'AUTO_REFRESH_ANALYTICS_SUMMARY',
    },
  ],
  FUNNEL: [
    {
      agentType: 'funnel_agent',
      actionId: 'create_landing_page',
      task: 'Create funnel landing and thank-you page drafts.',
      assetType: 'FUNNEL_ASSET',
      guardrailAction: 'FUNNEL_GENERATION',
    },
    {
      agentType: 'crm_agent',
      actionId: 'follow_up_script',
      task: 'Prepare lead routing and follow-up workflow.',
      assetType: 'CRM_ASSET',
      dependsOn: ['funnel_agent'],
      guardrailAction: 'CRM_UPDATE',
    },
  ],
  WEBINAR: [
    {
      agentType: 'webinar_agent',
      actionId: 'generate_webinar_deck',
      task: 'Create the webinar presentation deck and narrative structure.',
      assetType: 'WEBINAR_ASSET',
      guardrailAction: 'CONTENT_GENERATION',
    },
    {
      agentType: 'content_agent',
      actionId: 'generate_content',
      task: 'Create the speaker script and talk track for the webinar.',
      assetType: 'WEBINAR_ASSET',
      dependsOn: ['webinar_agent'],
      guardrailAction: 'CONTENT_GENERATION',
    },
    {
      agentType: 'offer_agent',
      actionId: 'offer_improvement',
      task: 'Prepare the offer stack, objection handling, and CTA.',
      assetType: 'OFFER_ASSET',
      dependsOn: ['content_agent'],
      guardrailAction: 'TASK_CREATION',
    },
    {
      agentType: 'crm_agent',
      actionId: 'follow_up_script',
      task: 'Prepare WhatsApp and email follow-up for webinar attendees.',
      assetType: 'CRM_ASSET',
      dependsOn: ['offer_agent'],
      guardrailAction: 'CRM_UPDATE',
    },
  ],
  CUSTOMERS: [
    {
      agentType: 'offer_agent',
      actionId: 'offer_review',
      task: 'Review the offer and prepare conversion improvements.',
      assetType: 'OFFER_ASSET',
      guardrailAction: 'AUTO_GENERATE_OFFER_DRAFT',
    },
    {
      agentType: 'crm_agent',
      actionId: 'follow_up_script',
      task: 'Prepare customer follow-up workflow for the offer.',
      assetType: 'CRM_ASSET',
      dependsOn: ['offer_agent'],
      guardrailAction: 'CRM_UPDATE',
    },
  ],
  RETENTION: [
    {
      agentType: 'crm_agent',
      actionId: 'retention_suggestions',
      task: 'Segment customers and draft the retention workflow.',
      assetType: 'CRM_ASSET',
      guardrailAction: 'CRM_UPDATE',
    },
    {
      agentType: 'content_agent',
      actionId: 'generate_content',
      task: 'Create retention content from CRM segments.',
      assetType: 'CONTENT_ASSET',
      dependsOn: ['crm_agent'],
      guardrailAction: 'CONTENT_GENERATION',
    },
  ],
  TEAM: [
    {
      agentType: 'content_agent',
      actionId: 'generate_content',
      task: 'Draft internal communication for the operating process.',
      assetType: 'CONTENT_ASSET',
      guardrailAction: 'CONTENT_GENERATION',
    },
    {
      agentType: 'crm_agent',
      actionId: 'customer_segmentation',
      task: 'Provide customer and ownership context for the process.',
      assetType: 'CRM_ASSET',
      guardrailAction: 'CRM_UPDATE',
    },
    {
      agentType: 'sop_generator_agent',
      actionId: 'generate_sop',
      task: 'Create the SOP from content and CRM inputs.',
      assetType: 'SOP_ASSET',
      dependsOn: ['content_agent', 'crm_agent'],
      guardrailAction: 'AUTO_GENERATE_SOP_DRAFT',
    },
  ],
};

const FALLBACK_TEMPLATE: WorkforceTemplateAssignment[] = [
  {
    agentType: 'coo_agent',
    actionId: 'prepare_execution_plan',
    task: 'Prepare the execution plan and identify the next safe assignment.',
    assetType: 'EXECUTION_PLAN',
    guardrailAction: 'TASK_CREATION',
  },
];

function assignmentId(plan: MissionPlan, agentType: WorkforceAgentType) {
  return `workforce-${plan.id}-${agentType}`;
}

function assetBelongsToAssignment(asset: MissionWorkspaceAsset, template: WorkforceTemplateAssignment) {
  return asset.sourceAgentId === template.agentType.replaceAll('_', '-')
    || asset.sourceAgentId === template.agentType
    || asset.agentActionId === template.actionId
    || asset.generatedBy === WORKFORCE_AGENT_REGISTRY[template.agentType]?.name;
}

function modeFor(templates: WorkforceTemplateAssignment[]): WorkforceMode {
  const hasDependencies = templates.some((template) => (template.dependsOn?.length ?? 0) > 0);
  const hasParallelReady = templates.filter((template) => !template.dependsOn?.length).length > 1;
  if (hasDependencies && hasParallelReady) return 'hybrid';
  if (hasDependencies) return templates.length > 2 ? 'hybrid' : 'sequential';
  return 'parallel';
}

function stateFor(input: {
  hasOutput: boolean;
  dependencyOutputIds: string[];
  expectedDependencyCount: number;
  guardrailAllowed: boolean;
}): WorkforceAssignmentQueueState {
  if (!input.guardrailAllowed) return 'BLOCKED';
  if (input.hasOutput) return 'COMPLETED';
  if (input.expectedDependencyCount > 0 && input.dependencyOutputIds.length < input.expectedDependencyCount) return 'WAITING';
  return 'READY';
}

function buildDependencyGraph(assignments: WorkforcePlanAssignment[]) {
  return assignments.map((assignment) => ({
    assignmentId: assignment.assignmentId,
    dependsOn: assignment.dependsOn,
    unlocks: assignments
      .filter((candidate) => candidate.dependsOn.includes(assignment.assignmentId))
      .map((candidate) => candidate.assignmentId),
  }));
}

export function createWorkforcePlan(input: {
  plan: MissionPlan;
  generatedAssets?: MissionWorkspaceAsset[];
  requestedBy?: string;
}): WorkforcePlan {
  const templates = WORKFORCE_TEMPLATES[input.plan.missionType] ?? FALLBACK_TEMPLATE;
  const generatedAssets = input.generatedAssets ?? [];
  const outputIdsByAgentType = new Map<WorkforceAgentType, string[]>();

  for (const template of templates) {
    outputIdsByAgentType.set(
      template.agentType,
      generatedAssets
        .filter((asset) => assetBelongsToAssignment(asset, template) && asset.status !== 'ARCHIVED')
        .map((asset) => asset.id),
    );
  }

  const agents: WorkforcePlanAssignment[] = templates.map((template) => {
    const registryAgent = WORKFORCE_AGENT_REGISTRY[template.agentType];
    const dependsOn = (template.dependsOn ?? []).map((agentType) => assignmentId(input.plan, agentType));
    const dependencyOutputIds = (template.dependsOn ?? []).flatMap((agentType) => outputIdsByAgentType.get(agentType) ?? []);
    const outputAssetIds = outputIdsByAgentType.get(template.agentType) ?? [];
    const guardrail = guardrailEngine.evaluate({
      action: template.guardrailAction,
      requestedBy: input.requestedBy,
      affectedResources: [input.plan.id, input.plan.route, template.assetType],
    });

    return {
      assignmentId: assignmentId(input.plan, template.agentType),
      agentId: template.agentType.replaceAll('_', '-'),
      agentType: template.agentType,
      agentName: registryAgent.name,
      task: template.task,
      actionId: template.actionId,
      assetType: template.assetType,
      dependsOn,
      executionLevel: guardrail.executionLevel,
      status: stateFor({
        hasOutput: outputAssetIds.length > 0,
        dependencyOutputIds,
        expectedDependencyCount: template.dependsOn?.length ?? 0,
        guardrailAllowed: guardrail.allowed,
      }),
      outputAssetIds,
      handoffFrom: dependencyOutputIds,
      handoffTo: [],
      guardrail,
    };
  });

  const agentsWithHandoffs = agents.map((assignment) => ({
    ...assignment,
    handoffTo: agents
      .filter((candidate) => candidate.dependsOn.includes(assignment.assignmentId))
      .map((candidate) => candidate.assignmentId),
  }));
  const currentAssignment = agentsWithHandoffs.find((assignment) => assignment.status === 'RUNNING')
    ?? agentsWithHandoffs.find((assignment) => assignment.status === 'READY')
    ?? agentsWithHandoffs.find((assignment) => assignment.status === 'BLOCKED');

  return {
    missionId: input.plan.id,
    missionType: input.plan.missionType,
    mode: modeFor(templates),
    agents: agentsWithHandoffs,
    dependencyGraph: buildDependencyGraph(agentsWithHandoffs),
    currentAssignmentId: currentAssignment?.assignmentId,
    verificationBoundary: 'workforce_completion_not_mission_completion',
  };
}

async function writeWorkforceAuditIfMissing(input: {
  user: AuthUser;
  action: string;
  targetKey: string;
  metadata: Record<string, unknown>;
}) {
  await writeAuditIfMissing({
    tenantId: input.user.tenantId,
    actorId: input.user.id,
    action: input.action,
    targetType: 'agent_workforce',
    targetId: null,
    targetKey: input.targetKey,
    metadata: input.metadata,
  });
}

export async function ensureWorkforcePlanAudit(input: {
  user: AuthUser;
  workforcePlan: WorkforcePlan;
}) {
  await runAuditBestEffort({
    operation: 'ensureWorkforcePlanAudit',
    tenantId: input.user.tenantId,
    actorId: input.user.id,
    missionId: input.workforcePlan.missionId,
  }, async () => {
    await writeWorkforceAuditIfMissing({
      user: input.user,
      action: WORKFORCE_AUDIT_ACTIONS.planCreated,
      targetKey: input.workforcePlan.missionId,
      metadata: {
        missionId: input.workforcePlan.missionId,
        missionType: input.workforcePlan.missionType,
        mode: input.workforcePlan.mode,
        agents: input.workforcePlan.agents.map((assignment) => ({
          assignmentId: assignment.assignmentId,
          agentId: assignment.agentId,
          task: assignment.task,
          dependsOn: assignment.dependsOn,
          executionLevel: assignment.executionLevel,
          status: assignment.status,
        })),
        dependencyGraph: input.workforcePlan.dependencyGraph,
        verificationBoundary: input.workforcePlan.verificationBoundary,
      },
    });

    await Promise.all(input.workforcePlan.agents
      .filter((assignment) => assignment.handoffFrom.length > 0 && assignment.status === 'READY')
      .map((assignment) => writeWorkforceAuditIfMissing({
        user: input.user,
        action: WORKFORCE_AUDIT_ACTIONS.assetHandoffCompleted,
        targetKey: `${input.workforcePlan.missionId}:${assignment.assignmentId}`,
        metadata: {
          missionId: input.workforcePlan.missionId,
          assignmentId: assignment.assignmentId,
          handoffFrom: assignment.handoffFrom,
          handoffTo: assignment.assignmentId,
        },
      })));
  });
}

export const workforceOrchestrator = {
  createPlan: createWorkforcePlan,
  ensurePlanAudit: ensureWorkforcePlanAudit,
};
