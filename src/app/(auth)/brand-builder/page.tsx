import { redirect } from 'next/navigation';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { getWizardState, getCurrentStepPath, isWizardComplete } from '@/modules/brand-builder/services/wizard-state-service';

export default async function BrandBuilderEntryPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const state = await getWizardState(user.id);

  if (isWizardComplete(state)) {
    redirect('/brand-builder/calendar');
  }

  redirect(getCurrentStepPath(state));
}
