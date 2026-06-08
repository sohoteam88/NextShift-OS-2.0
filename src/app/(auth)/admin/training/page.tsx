import { redirect } from 'next/navigation';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { TrainingModulesConfig } from '@/modules/admin/components/TrainingModulesConfig';

export default async function AdminTrainingPage() {
  const user = await getAuthUser();

  if (!user) redirect('/login');
  if (!['operator', 'platform_admin'].includes(user.role)) redirect('/dashboard');

  return <TrainingModulesConfig />;
}
