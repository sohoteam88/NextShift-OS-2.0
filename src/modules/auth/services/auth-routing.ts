import type { AuthUser } from './auth-service';

export function resolveAuthRedirect(user: AuthUser): '/pending' | '/login' | null {
  if (user.status === 'pending') return '/pending';
  if (user.status === 'suspended') return '/login';
  return null;
}
