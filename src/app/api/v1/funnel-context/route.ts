import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { getAllFunnelContexts } from '@/modules/funnel-context/funnelContextProvider';

export const GET = apiHandler(async (req: NextRequest) => {
  const user = await requireAuthApi(req);
  return NextResponse.json({ data: await getAllFunnelContexts(user.id) });
});
