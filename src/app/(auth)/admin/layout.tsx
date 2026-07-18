import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getAuthUser } from '@/modules/auth/services/auth-service';

const ADMIN_BASE_ROLES = ['leader', 'operator'];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getAuthUser();

  if (!user) {
    redirect('/login');
  }

  if (user.tenantStatus === 'deleted' || !ADMIN_BASE_ROLES.includes(user.role)) {
    redirect('/dashboard');
  }

  return children;
}
