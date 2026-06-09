import { redirect } from 'next/navigation';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { CalendarStepClient } from '@/modules/brand-builder/components/wizard/CalendarStepClient';

export default async function CalendarStepPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  return <CalendarStepClient />;
}
