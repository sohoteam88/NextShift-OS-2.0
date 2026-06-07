import { NextRequest } from 'next/server';
import { getAuthUser, type AuthUser } from './auth-service';

export async function requireAuth(request: NextRequest): Promise<AuthUser> {
  void request;

  const user = await getAuthUser();
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  if (user.status === 'pending') {
    throw new Error('MEMBER_PENDING');
  }
  if (user.status === 'suspended') {
    throw new Error('UNAUTHORIZED');
  }
  return user;
}
