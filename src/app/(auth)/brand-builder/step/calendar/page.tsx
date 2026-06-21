import { redirect } from 'next/navigation';
import { getAuthUser } from '@/modules/auth/services/auth-service';

export default async function CalendarStepPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  redirect('/content-engine');
}
