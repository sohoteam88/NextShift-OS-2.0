import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { ceoAdvisorEngine } from '@/modules/business-intelligence/ceoAdvisorEngine';

export const GET = apiHandler(async (req: NextRequest) => {
  const user = await requireAuthApi(req);
  return NextResponse.json({ data: await ceoAdvisorEngine.generateCEOReport(user.id, user.tenantId) });
});
