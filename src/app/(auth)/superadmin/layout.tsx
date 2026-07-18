import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getAuthUser } from '@/modules/auth/services/auth-service';

export default async function SuperadminLayout({ children }: { children: ReactNode }) {
  const user = await getAuthUser();
  if (!user) redirect('/login');
  if (user.role !== 'platform_admin') redirect('/dashboard');
  return children;
}
