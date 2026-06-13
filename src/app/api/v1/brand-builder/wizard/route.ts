import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { getWizardState, WIZARD_STEPS, getCurrentStepPath } from '@/modules/brand-builder/services/wizard-state-service';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const state = await getWizardState(user.id);
  return NextResponse.json({ data: { state, steps: WIZARD_STEPS, currentPath: getCurrentStepPath(state) } });
});
