import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { funnelHealthService } from '@/modules/funnel/services/funnel-health-service';

async function getId(context: { params: Promise<Record<string, string>> | Record<string, string> } | undefined) {
  return (await Promise.resolve(context!.params)).id;
}

export const GET = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request);
  const funnelId = await getId(context);
  const health = await funnelHealthService.calculate(funnelId, user);
  return NextResponse.json({ data: health });
});
