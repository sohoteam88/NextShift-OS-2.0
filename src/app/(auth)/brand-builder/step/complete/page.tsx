import { redirect } from 'next/navigation';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { CompleteStepClient } from '@/modules/brand-builder/components/wizard/CompleteStepClient';

export default async function CompleteStepPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  return <CompleteStepClient userName={user.name} />;
}
