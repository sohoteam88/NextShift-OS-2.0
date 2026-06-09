import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { completeWizardStep } from '@/modules/brand-builder/services/wizard-state-service';

const schema = z.object({ stepId: z.string() });

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = schema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const newState = await completeWizardStep(user.id, body.data.stepId);
  return NextResponse.json({ data: newState });
}
