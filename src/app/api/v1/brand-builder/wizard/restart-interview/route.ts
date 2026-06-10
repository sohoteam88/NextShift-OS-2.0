import { NextResponse } from 'next/server';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { restartInterviewStep } from '@/modules/brand-builder/services/wizard-state-service';

export async function POST() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const state = await restartInterviewStep(user.id);
  return NextResponse.json({ data: state });
}
