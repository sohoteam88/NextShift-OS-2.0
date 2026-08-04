import { redirect } from 'next/navigation';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { RoutePlaceholder } from '@/modules/user-shell/components/RoutePlaceholder';

export default async function PostPage() {
  const user = await getAuthUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role === 'platform_admin') {
    redirect('/superadmin');
  }

  return <RoutePlaceholder title="马上就好" description="内容准备好后，会直接放在这里。" />;
}
