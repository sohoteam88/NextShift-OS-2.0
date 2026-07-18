import { AppError } from '@/lib/errors';
import { getAuthUser, type AuthUser } from '@/modules/auth/services/auth-service';

type PlatformPrincipalLoader = () => Promise<AuthUser | null>;

/** Shared service-layer authority for every cross-tenant platform data load. */
export async function requirePlatformAdminDataAccess(
  loadPrincipal: PlatformPrincipalLoader = getAuthUser,
): Promise<AuthUser> {
  const principal = await loadPrincipal();
  if (!principal) throw new AppError('UNAUTHORIZED', 401, 'Authentication required');
  if (principal.status !== 'active') {
    throw new AppError('UNAUTHORIZED', 401, 'An active platform administrator is required');
  }
  if (principal.role !== 'platform_admin') {
    throw new AppError('FORBIDDEN', 403, 'Platform data access denied');
  }
  return principal;
}
