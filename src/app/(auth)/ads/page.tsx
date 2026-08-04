import { redirect } from 'next/navigation';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { RoutePlaceholder } from '@/modules/user-shell/components/RoutePlaceholder';

export default async function AdsPage() {
  const user = await getAuthUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role === 'platform_admin') {
    redirect('/superadmin');
  }

  return <RoutePlaceholder title="即将开放" description="广告陪驾准备好后，会直接放在这里。" />;
}
