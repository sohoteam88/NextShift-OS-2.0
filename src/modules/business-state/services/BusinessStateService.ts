import prisma from '@/lib/prisma';
import type { AuthUser } from '@/modules/auth/services/auth-service';
import type { BusinessState } from '../contracts/BusinessState';
import type { BusinessStateResult } from '../contracts/BusinessStateResult';
import { assembleBusinessState } from '../adapters/BusinessStateAssembler';

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

export const businessStateService = {
  async getBusinessState(userId: string): Promise<BusinessState> {
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
  },

  async getBusinessStateResult(userId: string): Promise<BusinessStateResult> {
    const state = await this.getBusinessState(userId);
    return state.stateResult;
  },
};

export async function getBusinessState(userId: string): Promise<BusinessState> {
  return businessStateService.getBusinessState(userId);
}

export async function getBusinessStateResult(userId: string): Promise<BusinessStateResult> {
  return businessStateService.getBusinessStateResult(userId);
}
