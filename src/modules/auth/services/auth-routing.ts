import type { AuthUser } from './auth-service';

const ADMIN_ROLES = new Set(['operator', 'platform_admin']);

export function isAdminRole(role: string) {
  return ADMIN_ROLES.has(role);
}

export function homeRouteForRole(role: string): '/superadmin' | '/admin' | '/' {
  if (role === 'platform_admin') return '/superadmin';
  if (isAdminRole(role)) return '/admin';
  return '/';
}

export function resolveAuthRedirect(user: AuthUser): '/pending' | '/login' | null {
  if (user.status === 'pending') return '/pending';
  if (user.status === 'suspended') return '/login';
  return null;
}
