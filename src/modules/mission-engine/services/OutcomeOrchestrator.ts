import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import type { AuthUser } from '@/modules/auth/services/auth-service';
import type { MissionPlan, MissionType } from '../contracts/MissionAuthority';
import type { BottleneckSignals } from './BottleneckEngine';
import { missionCompletionVerifier } from './MissionCompletionVerifier';
import { missionGeneratorV2 } from './MissionGeneratorV2';

export type OutcomeTemplateId =
  | 'FIRST_LEAD'
  | 'FIRST_CUSTOMER'
  | 'FIRST_REVENUE'
  | 'RETENTION_SYSTEM'
  | 'TEAM_SCALING'
  | 'AUTHORITY_BUILDING';

export type OutcomeStatus = 'PLANNED' | 'ACTIVE' | 'BLOCKED' | 'COMPLETED' | 'FAILED';
export type OutcomeMissionStatus = 'LOCKED' | 'ACTIVE' | 'BLOCKED' | 'COMPLETED' | 'FAILED';

export type MissionNode = {
  missionId: string;
  missionType: MissionType;
  name: string;
  route: string;
  dependsOn: string[];
  status: OutcomeMissionStatus;
  completionPercentage: number;
  workforcePlanId: string;
};

export type OutcomeSignal = {
  id: string;
  label: string;
  verified: boolean;
  currentValue: number | boolean | null;
  operator: '>' | '>=' | '==';
  targetValue: number | boolean;
};

export type BusinessOutcome = {
  id: string;
  templateId: OutcomeTemplateId;
  name: string;
  description: string;
  missions: MissionNode[];
  completionPercentage: number;
  status: OutcomeStatus;
  currentMissionId?: string;
  nextMissionId?: string;
  blockedMissionIds: string[];
  requiredSignal: OutcomeSignal;
  verificationBoundary: 'outcome_completion_requires_missions_and_signal';
};

type OutcomeTemplateMission = {
  missionType: MissionType;
  dependsOn?: MissionType[];
};

type OutcomeTemplate = {
  id: OutcomeTemplateId;
  name: string;
  description: string;
  missions: OutcomeTemplateMission[];
  signal: Omit<OutcomeSignal, 'verified' | 'currentValue'> & {
    read: (signals?: Partial<BottleneckSignals> | null) => number | boolean | null;
  };
};

export const OUTCOME_AUDIT_ACTIONS = {
  created: 'outcome.created',
  started: 'outcome.started',
  progressed: 'outcome.progressed',
  blocked: 'outcome.blocked',
  completed: 'outcome.completed',
} as const;

const OUTCOME_TEMPLATES: Record<OutcomeTemplateId, OutcomeTemplate> = {
  FIRST_LEAD: {
    id: 'FIRST_LEAD',
    name: 'Acquire First Lead',
    description: 'Coordinate lead magnet, funnel, and traffic missions until a real lead is captured.',
    missions: [
      { missionType: 'LEAD_MAGNET' },
      { missionType: 'FUNNEL', dependsOn: ['LEAD_MAGNET'] },
      { missionType: 'TRAFFIC', dependsOn: ['FUNNEL'] },
    ],
    signal: {
      id: 'leadCount',
      label: 'Lead count',
      operator: '>',
      targetValue: 0,
      read: (signals) => signals?.leadCount ?? null,
    },
  },
  FIRST_CUSTOMER: {
    id: 'FIRST_CUSTOMER',
    name: 'Acquire First Customer',
    description: 'Coordinate lead generation and conversion missions until the first customer is recorded.',
    missions: [
      { missionType: 'LEAD_MAGNET' },
      { missionType: 'FUNNEL', dependsOn: ['LEAD_MAGNET'] },
      { missionType: 'TRAFFIC', dependsOn: ['FUNNEL'] },
      { missionType: 'CUSTOMERS', dependsOn: ['TRAFFIC'] },
    ],
    signal: {
      id: 'customerCount',
      label: 'Customer count',
      operator: '>',
      targetValue: 0,
      read: (signals) => signals?.customerCount ?? null,
    },
  },
  FIRST_REVENUE: {
    id: 'FIRST_REVENUE',
    name: 'Generate First Revenue',
    description: 'Coordinate conversion work until revenue is verified from business signals.',
    missions: [
      { missionType: 'CUSTOMERS' },
    ],
    signal: {
      id: 'revenue',
      label: 'Revenue',
      operator: '>',
      targetValue: 0,
      read: (signals) => signals?.revenue ?? null,
    },
  },
  RETENTION_SYSTEM: {
    id: 'RETENTION_SYSTEM',
    name: 'Build Retention System',
    description: 'Coordinate retention workflow missions until customer follow-up value is verified.',
    missions: [
      { missionType: 'RETENTION' },
      { missionType: 'CONTENT', dependsOn: ['RETENTION'] },
    ],
    signal: {
      id: 'retentionRate',
      label: 'Retention rate',
      operator: '>=',
      targetValue: 20,
      read: (signals) => signals?.retentionRate ?? null,
    },
  },
  TEAM_SCALING: {
    id: 'TEAM_SCALING',
    name: 'Scale Team Execution',
    description: 'Coordinate SOP and ownership missions until repeatable execution is verified.',
    missions: [
      { missionType: 'TEAM' },
    ],
    signal: {
      id: 'sopCount',
      label: 'SOP count',
      operator: '>',
      targetValue: 0,
      read: (signals) => signals?.sopCount ?? null,
    },
  },
  AUTHORITY_BUILDING: {
    id: 'AUTHORITY_BUILDING',
    name: 'Build Market Authority',
    description: 'Coordinate content and lead capture missions until authority signals are visible.',
    missions: [
      { missionType: 'CONTENT' },
      { missionType: 'LEAD_MAGNET', dependsOn: ['CONTENT'] },
    ],
    signal: {
      id: 'publishedContentCount',
      label: 'Published content count',
      operator: '>=',
      targetValue: 3,
      read: (signals) => signals?.publishedContentCount ?? null,
    },
  },
};

function missionId(missionType: MissionType) {
  return `mission-plan-${missionType.toLowerCase()}`;
}

function compare(value: number | boolean | null, operator: OutcomeSignal['operator'], target: number | boolean) {
  if (value === null) return false;
  if (operator === '==') return value === target;
  if (typeof value !== 'number' || typeof target !== 'number') return false;
  if (operator === '>') return value > target;
  return value >= target;
}

function pickTemplate(input: {
  currentMissionType?: MissionType;
  signals?: Partial<BottleneckSignals> | null;
  preferredOutcomeId?: OutcomeTemplateId;
}): OutcomeTemplate {
  if (input.preferredOutcomeId) return OUTCOME_TEMPLATES[input.preferredOutcomeId];
  if ((input.signals?.customerCount ?? 0) > 0) return OUTCOME_TEMPLATES.FIRST_REVENUE;
  if (input.currentMissionType === 'CUSTOMERS') return OUTCOME_TEMPLATES.FIRST_CUSTOMER;
  if (input.currentMissionType === 'RETENTION') return OUTCOME_TEMPLATES.RETENTION_SYSTEM;
  if (input.currentMissionType === 'TEAM') return OUTCOME_TEMPLATES.TEAM_SCALING;
  if (input.currentMissionType === 'CONTENT') return OUTCOME_TEMPLATES.AUTHORITY_BUILDING;
  return OUTCOME_TEMPLATES.FIRST_LEAD;
}

function nodeStatus(input: {
  plan: MissionPlan;
  dependencyCompleted: boolean;
  signals?: Partial<BottleneckSignals> | null;
  sourceAvailable?: boolean;
}): Pick<MissionNode, 'status' | 'completionPercentage'> {
  if (!input.dependencyCompleted) {
    return { status: 'LOCKED', completionPercentage: 0 };
  }

  const completion = missionCompletionVerifier.verify({
    missionPlan: input.plan,
    signals: input.signals,
    sourceAvailable: input.sourceAvailable,
  });

  if (completion.completed) {
    return { status: 'COMPLETED', completionPercentage: 100 };
  }
  if (completion.verificationStatus === 'VERIFYING') {
    return { status: 'BLOCKED', completionPercentage: completion.completionPercentage };
  }
  return { status: 'ACTIVE', completionPercentage: completion.completionPercentage };
}

export function createOutcomePlan(input: {
  currentMissionType?: MissionType;
  signals?: Partial<BottleneckSignals> | null;
  sourceAvailable?: boolean;
  preferredOutcomeId?: OutcomeTemplateId;
}): BusinessOutcome {
  const template = pickTemplate(input);
  const completedMissionIds = new Set<string>();
  const missions = template.missions.map((nodeTemplate): MissionNode => {
    const plan = missionGeneratorV2.generateForType({
      missionType: nodeTemplate.missionType,
      nextMilestone: template.name,
    });
    const dependsOn = (nodeTemplate.dependsOn ?? []).map(missionId);
    const dependencyCompleted = dependsOn.every((id) => completedMissionIds.has(id));
    const status = nodeStatus({
      plan,
      dependencyCompleted,
      signals: input.signals,
      sourceAvailable: input.sourceAvailable,
    });

    if (status.status === 'COMPLETED') completedMissionIds.add(plan.id);

    return {
      missionId: plan.id,
      missionType: plan.missionType,
      name: plan.objective,
      route: plan.route,
      dependsOn,
      status: status.status,
      completionPercentage: status.completionPercentage,
      workforcePlanId: `workforce-${plan.id}`,
    };
  });
  const currentValue = template.signal.read(input.signals);
  const { read, ...signalContract } = template.signal;
  void read;
  const requiredSignal: OutcomeSignal = {
    ...signalContract,
    currentValue,
    verified: compare(currentValue, signalContract.operator, signalContract.targetValue),
  };
  const completedMissionCount = missions.filter((mission) => mission.status === 'COMPLETED').length;
  const missionProgressUnits = completedMissionCount + (requiredSignal.verified ? 1 : 0);
  const completionPercentage = Math.floor((missionProgressUnits / (missions.length + 1)) * 100);
  const allMissionsCompleted = completedMissionCount === missions.length;
  const blockedMissionIds = missions.filter((mission) => mission.status === 'BLOCKED').map((mission) => mission.missionId);
  const currentMission = missions.find((mission) => mission.status === 'ACTIVE' || mission.status === 'BLOCKED');
  const nextMission = missions.find((mission) => mission.status === 'LOCKED');
  const status: OutcomeStatus = allMissionsCompleted && requiredSignal.verified
    ? 'COMPLETED'
    : blockedMissionIds.length > 0 || (allMissionsCompleted && !requiredSignal.verified)
      ? 'BLOCKED'
      : completedMissionCount > 0 || currentMission
        ? 'ACTIVE'
        : 'PLANNED';

  return {
    id: `outcome-${template.id.toLowerCase()}`,
    templateId: template.id,
    name: template.name,
    description: template.description,
    missions,
    completionPercentage,
    status,
    currentMissionId: currentMission?.missionId,
    nextMissionId: nextMission?.missionId,
    blockedMissionIds,
    requiredSignal,
    verificationBoundary: 'outcome_completion_requires_missions_and_signal',
  };
}

async function writeAuditIfMissing(input: {
  user: AuthUser;
  action: string;
  targetId: string;
  metadata: Record<string, unknown>;
}) {
  const existing = await prisma.auditLog.findFirst({
    where: {
      tenantId: input.user.tenantId,
      actorId: input.user.id,
      action: input.action,
      targetType: 'business_outcome',
      targetId: input.targetId,
    },
    select: { id: true },
  });
  if (existing) return;

  await prisma.auditLog.create({
    data: {
      tenantId: input.user.tenantId,
      actorId: input.user.id,
      action: input.action,
      targetType: 'business_outcome',
      targetId: input.targetId,
      metadata: {
        ...input.metadata,
        timestamp: new Date().toISOString(),
      } as Prisma.InputJsonValue,
    },
  });
}

export async function ensureOutcomeAudit(input: {
  user: AuthUser;
  outcome: BusinessOutcome;
}) {
  const baseMetadata = {
    outcomeId: input.outcome.id,
    templateId: input.outcome.templateId,
    status: input.outcome.status,
    completionPercentage: input.outcome.completionPercentage,
    missionIds: input.outcome.missions.map((mission) => mission.missionId),
    requiredSignal: input.outcome.requiredSignal,
    verificationBoundary: input.outcome.verificationBoundary,
  };

  await writeAuditIfMissing({
    user: input.user,
    action: OUTCOME_AUDIT_ACTIONS.created,
    targetId: input.outcome.id,
    metadata: baseMetadata,
  });

  const lifecycleAction = input.outcome.status === 'COMPLETED'
    ? OUTCOME_AUDIT_ACTIONS.completed
    : input.outcome.status === 'BLOCKED'
      ? OUTCOME_AUDIT_ACTIONS.blocked
      : input.outcome.status === 'ACTIVE'
        ? OUTCOME_AUDIT_ACTIONS.started
        : null;

  if (lifecycleAction) {
    await writeAuditIfMissing({
      user: input.user,
      action: lifecycleAction,
      targetId: `${input.outcome.id}:${input.outcome.status}`,
      metadata: baseMetadata,
    });
  }

  if (input.outcome.completionPercentage > 0 && input.outcome.status !== 'COMPLETED') {
    await writeAuditIfMissing({
      user: input.user,
      action: OUTCOME_AUDIT_ACTIONS.progressed,
      targetId: `${input.outcome.id}:${input.outcome.completionPercentage}`,
      metadata: baseMetadata,
    });
  }
}

export const outcomeOrchestrator = {
  createPlan: createOutcomePlan,
  ensureAudit: ensureOutcomeAudit,
};
