import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { runtimeStateService } from '@/modules/agent-runtime/services/RuntimeStateService';
import { toWorkforceViewModel } from '@/modules/agent-runtime/view-models/WorkforceViewModelAdapter';

export const GET = apiHandler(async (req: NextRequest) => {
  const user = await requireAuthApi(req);
  const runtimeState = await runtimeStateService.getRuntimeState(user.id);
  return NextResponse.json({ data: toWorkforceViewModel(runtimeState) });
});
