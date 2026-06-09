import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { completeWizardStep, saveWizardState } from '@/modules/brand-builder/services/wizard-state-service';

const schema = z.object({
  stepId: z.string(),
  interviewId: z.string().optional(),
});

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = schema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const { stepId, interviewId } = body.data;

  if (interviewId) {
    await saveWizardState(user.id, { interview_id: interviewId });
  }

  const newState = await completeWizardStep(user.id, stepId);
  return NextResponse.json({ data: newState });
}
