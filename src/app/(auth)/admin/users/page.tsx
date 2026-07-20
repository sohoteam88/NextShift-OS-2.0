import { redirect } from 'next/navigation';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { UserManagementPanel } from '@/modules/admin/components/UserManagementPanel';

export default async function AdminUsersPage() {
  const user = await getAuthUser();

  if (!user) redirect('/login');
  if (user.role !== 'operator') redirect('/dashboard');

  return <UserManagementPanel currentUserId={user.id} currentUserRole="operator" />;
}
