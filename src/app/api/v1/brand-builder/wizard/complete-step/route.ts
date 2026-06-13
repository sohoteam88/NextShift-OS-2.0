import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { completeWizardStep, saveWizardState } from '@/modules/brand-builder/services/wizard-state-service';

const schema = z.object({ stepId: z.string(), interviewId: z.string().optional() });

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const body = schema.parse(await request.json());
  if (body.interviewId) await saveWizardState(user.id, { interview_id: body.interviewId });
  return NextResponse.json({ data: await completeWizardStep(user.id, body.stepId) });
});
