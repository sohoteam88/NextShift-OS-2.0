import { redirect } from 'next/navigation';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { RoutePlaceholder } from '@/modules/user-shell/components/RoutePlaceholder';

export default async function FollowPage() {
  const user = await getAuthUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role === 'platform_admin') {
    redirect('/superadmin');
  }

  return <RoutePlaceholder title="马上就好" description="需要跟进的人，会直接排在这里。" />;
}
