import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { completeWizardStep } from '@/modules/brand-builder/services/wizard-state-service';

const schema = z.object({ stepId: z.string() });

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const { stepId } = schema.parse(await request.json());
  return NextResponse.json({ data: await completeWizardStep(user.id, stepId) });
});
