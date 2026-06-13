import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { restartInterviewStep } from '@/modules/brand-builder/services/wizard-state-service';

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  return NextResponse.json({ data: await restartInterviewStep(user.id) });
});
