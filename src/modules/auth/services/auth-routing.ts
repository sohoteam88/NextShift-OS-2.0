import type { AuthUser } from './auth-service';

const ADMIN_ROLES = new Set(['operator', 'platform_admin']);

export function isAdminRole(role: string) {
  return ADMIN_ROLES.has(role);
}

export function homeRouteForRole(role: string): '/platform-admin' | '/admin' | '/dashboard' {
  if (role === 'platform_admin') return '/platform-admin';
  if (isAdminRole(role)) return '/admin';
  return '/dashboard';
}

export function resolveAuthRedirect(user: AuthUser): '/pending' | '/login' | null {
  if (user.status === 'pending') return '/pending';
  if (user.status === 'suspended') return '/login';
  return null;
}
