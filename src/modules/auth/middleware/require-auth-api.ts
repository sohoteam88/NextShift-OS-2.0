import { NextRequest } from 'next/server';
import { AppError } from '@/lib/errors';
import { getAuthUser, type AuthUser } from '../services/auth-service';

export async function requireAuthApi(request: NextRequest): Promise<AuthUser> {
  void request;

  const user = await getAuthUser();
  if (!user) {
    throw new AppError('UNAUTHORIZED', 401, 'Authentication required');
  }
  if (user.status === 'pending') {
    throw new AppError('MEMBER_PENDING', 403, 'Your account is pending approval');
  }
  if (user.status === 'suspended') {
    throw new AppError('UNAUTHORIZED', 401, 'Your account has been suspended');
  }
  return user;
}

export function requireRoleApi(user: AuthUser, allowedRoles: string[]): void {
  const roleHierarchy: Record<string, number> = {
    platform_admin: 100,
    operator: 80,
    leader: 60,
    member: 40,
  };

  const userLevel = roleHierarchy[user.role] ?? 0;
  const minLevel = Math.min(...allowedRoles.map((role) => roleHierarchy[role] ?? 0));

  if (userLevel < minLevel) {
    throw new AppError('FORBIDDEN', 403, 'Insufficient permissions');
  }
}

export function requireTenantApi(user: AuthUser, tenantId: string): void {
  if (user.role !== 'platform_admin' && user.tenantId !== tenantId) {
    throw new AppError('FORBIDDEN', 403, 'Cross-tenant access denied');
  }
}
