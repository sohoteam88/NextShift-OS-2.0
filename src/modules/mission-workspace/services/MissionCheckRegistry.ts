import { AppError } from '@/lib/errors';
import { createAudit, reportAuditFailure } from '@/lib/audit-log-writer';
import type { AuthUser } from '@/modules/auth/services/auth-service';
import type { MissionPlan, MissionStep, MissionType } from '@/modules/mission-engine/contracts/MissionAuthority';
import { missionEngineAuthorityService } from '@/modules/mission-engine/services/MissionEngineAuthorityService';

export type MissionCheckRegistry = {
  missionType: MissionType;
  allowedChecks: string[];
};

export type MissionCheckValidation = {
  missionId: string;
  missionType: MissionType;
  checkKey: string;
  result: 'accepted' | 'rejected';
};

export function getWorkspaceStepCheckKey(plan: MissionPlan, step: MissionStep, index: number) {
  const key = `workspace.step.${plan.missionType.toLowerCase()}.${index + 1}.${step.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
  return key.slice(0, 100);
}

export function registryForMissionPlan(plan: MissionPlan): MissionCheckRegistry {
  return {
    missionType: plan.missionType,
    allowedChecks: plan.steps.map((step, index) => getWorkspaceStepCheckKey(plan, step, index)),
  };
}

async function recordCompletionCheckAudit(input: {
  user: AuthUser;
  missionId: string;
  missionType: MissionType;
  checkKey: string;
  result: 'accepted' | 'rejected';
}) {
  try {
    await createAudit({
      tenantId: input.user.tenantId,
      actorId: input.user.id,
      action: `completion_check.${input.result}`,
      targetType: 'mission_workspace_check',
      targetId: null,
      targetKey: input.missionId,
      metadata: {
        missionId: input.missionId,
        missionType: input.missionType,
        checkKey: input.checkKey,
        result: input.result,
      },
    });
  } catch (error) {
    reportAuditFailure(error, {
      operation: 'recordCompletionCheckAudit',
      tenantId: input.user.tenantId,
      actorId: input.user.id,
      missionId: input.missionId,
      checkKey: input.checkKey,
    });
  }
}

export async function validateMissionWorkspaceCheck(input: {
  user: AuthUser;
  checkKey: string;
}): Promise<MissionCheckValidation> {
  const authority = await missionEngineAuthorityService.getCurrentMission(input.user.id);
  const registry = registryForMissionPlan(authority.missionPlan);
  const accepted = registry.allowedChecks.includes(input.checkKey);

  if (!accepted) {
    await recordCompletionCheckAudit({
      user: input.user,
      missionId: authority.missionPlan.id,
      missionType: authority.missionPlan.missionType,
      checkKey: input.checkKey,
      result: 'rejected',
    });
    throw new AppError('INVALID_CHECK_KEY', 400, 'The supplied check does not belong to the active mission.');
  }

  return {
    missionId: authority.missionPlan.id,
    missionType: authority.missionPlan.missionType,
    checkKey: input.checkKey,
    result: 'accepted',
  };
}

export async function recordAcceptedMissionWorkspaceCheck(input: {
  user: AuthUser;
  validation: MissionCheckValidation;
}) {
  await recordCompletionCheckAudit({
    user: input.user,
    missionId: input.validation.missionId,
    missionType: input.validation.missionType,
    checkKey: input.validation.checkKey,
    result: 'accepted',
  });
}

export const missionCheckRegistry = {
  registryForMissionPlan,
  getWorkspaceStepCheckKey,
  validateWorkspaceCheck: validateMissionWorkspaceCheck,
  recordAcceptedWorkspaceCheck: recordAcceptedMissionWorkspaceCheck,
};
