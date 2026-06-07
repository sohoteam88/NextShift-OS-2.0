import { createServerSupabaseClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';

export type AuthUser = {
  id: string;
  email: string;
  tenantId: string;
  role: string;
  name: string;
  preferredLanguage: string;
  status: 'active' | 'pending' | 'suspended';
};

export async function getAuthUser(): Promise<AuthUser | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const dbUser = await prisma.user.findFirst({
    where: { id: user.id, deletedAt: null },
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

  if (!dbUser) return null;

  return {
    id: dbUser.id,
    email: dbUser.email,
    tenantId: dbUser.tenantId,
    role: dbUser.role,
    name: dbUser.name,
    preferredLanguage: dbUser.languagePreference,
    status: dbUser.status as AuthUser['status'],
  };
}

export function requireRole(userRole: string, allowedRoles: string[]): void {
  if (!allowedRoles.includes(userRole)) {
    throw new Error('FORBIDDEN');
  }
}
