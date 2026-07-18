import { NextRequest } from 'next/server';
import { AppError } from '@/lib/errors';
import { getAuthUser, type AuthUser } from '../services/auth-service';
import { createServerSupabaseClient } from '@/lib/supabase/server';

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
  // getAuthUser re-reads the retained Tenant row for every request. Keeping the
  // status on the resolved principal avoids a second database round-trip here.
  if (user.tenantStatus === 'deleted' && user.role !== 'platform_admin') {
    // A retained tenant row is the live authority, not a stale token claim.
    // Terminate the local issued session on its next authenticated request.
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut({ scope: 'local' });
    throw new AppError('TENANT_DELETED', 403, 'This tenant has been deleted');
  }
  return user;
}

export function requireRoleApi(user: AuthUser, allowedRoles: string[]): void {
  const knownRoles = new Set(['platform_admin', 'operator', 'leader', 'member']);
  const unknownRoles = allowedRoles.filter((role) => !knownRoles.has(role));
  if (unknownRoles.length > 0) {
    throw new AppError('FORBIDDEN', 403, `Unknown role requirement: ${unknownRoles.join(', ')}`);
  }

  if (!allowedRoles.includes(user.role)) {
    throw new AppError('FORBIDDEN', 403, 'Insufficient permissions');
  }
}

export function requireTenantApi(user: AuthUser, tenantId: string): void {
  if (user.role !== 'platform_admin' && user.tenantId !== tenantId) {
    throw new AppError('FORBIDDEN', 403, 'Cross-tenant access denied');
  }
}
