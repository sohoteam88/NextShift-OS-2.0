import prisma from '@/lib/prisma';
import type { AuthUser } from '@/modules/auth/services/auth-service';
import type { BusinessState } from '../contracts/BusinessState';
import type { BusinessStateResult } from '../contracts/BusinessStateResult';
import { assembleBusinessState } from '../adapters/BusinessStateAssembler';
import {
  resolveBusinessStateRuntime,
  type BusinessStateRuntimeMetadata,
  type BusinessStateRuntimeSource,
} from '../runtime';

function toAuthUser(user: {
  id: string;
  email: string;
  tenantId: string;
  role: string;
  name: string;
  languagePreference: string;
  status: string;
}): AuthUser {
  return {
    id: user.id,
    email: user.email,
    tenantId: user.tenantId,
    role: user.role,
    name: user.name,
    preferredLanguage: user.languagePreference,
    status: user.status === 'active' || user.status === 'suspended' ? user.status : 'pending',
  };
}

export type BusinessStateRuntimeOptions = {
  onRuntimeResolved?: (runtime: BusinessStateRuntimeMetadata) => void;
  resolveRuntimeBusinessState?: typeof resolveBusinessStateRuntime;
  source?: BusinessStateRuntimeSource;
};

async function resolveBusinessStateLegacy(userId: string): Promise<BusinessState> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      tenantId: true,
      role: true,
      name: true,
      languagePreference: true,
      status: true,
    },
  });

  if (!user) throw new Error('User not found');
  return assembleBusinessState(toAuthUser(user));
}

export const businessStateService = {
  async getBusinessState(
    userId: string,
    runtimeOptions: BusinessStateRuntimeOptions = {},
  ): Promise<BusinessState> {
    const { state, runtime } = await (runtimeOptions.resolveRuntimeBusinessState ?? resolveBusinessStateRuntime)({
      userId,
      source: runtimeOptions.source ?? 'business-state-service',
    }, {
      resolveBusinessState: () => resolveBusinessStateLegacy(userId),
    });
    runtimeOptions.onRuntimeResolved?.(runtime);
    return state;
  },

  async getBusinessStateResult(userId: string): Promise<BusinessStateResult> {
    const state = await this.getBusinessState(userId);
    return state.stateResult;
  },
};

export async function getBusinessState(
  userId: string,
  runtimeOptions: BusinessStateRuntimeOptions = {},
): Promise<BusinessState> {
  return businessStateService.getBusinessState(userId, runtimeOptions);
}

export async function getBusinessStateResult(userId: string): Promise<BusinessStateResult> {
  return businessStateService.getBusinessStateResult(userId);
}
