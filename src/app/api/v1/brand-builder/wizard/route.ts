import { NextResponse } from 'next/server';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { getWizardState, WIZARD_STEPS, getCurrentStepPath } from '@/modules/brand-builder/services/wizard-state-service';

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const state = await getWizardState(user.id);
  return NextResponse.json({
    data: {
      state,
      steps: WIZARD_STEPS,
      currentPath: getCurrentStepPath(state),
    },
  });
}
