import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { businessStateService } from '@/modules/business-state/services/BusinessStateService';
import { toFunnelHealthViewModel } from '@/modules/business-state/view-models/FunnelHealthViewModelAdapter';

async function getId(context: { params: Promise<Record<string, string>> | Record<string, string> } | undefined) {
  return (await Promise.resolve(context!.params)).id;
}

export const GET = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request);
  await getId(context);
  const health = toFunnelHealthViewModel(await businessStateService.getBusinessState(user.id));
  return NextResponse.json({ data: health });
});
