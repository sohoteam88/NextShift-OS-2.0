import { redirect } from 'next/navigation';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import {
  buildCompatibilityDestination,
  resolveWorkspaceCompatibilityPath,
  type RedirectPageProps,
} from '@/lib/navigation/compatibility-redirect';

export default async function WorkspacePathPage({
  params,
  searchParams,
}: {
  params: Promise<{ path: string[] }>;
} & RedirectPageProps) {
  const user = await getAuthUser();

  if (!user) redirect('/login');
  if (!['operator', 'platform_admin'].includes(user.role)) redirect('/dashboard');

  const { path } = await params;
  redirect(buildCompatibilityDestination(resolveWorkspaceCompatibilityPath(path), await searchParams));
}
