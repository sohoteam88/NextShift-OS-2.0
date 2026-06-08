import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { approvalService } from '@/modules/member/services/approval-service';

export const POST = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request);
  const params = await context?.params;
  const memberId = params?.id ?? '';

  await approvalService.approve(user, memberId);
  return NextResponse.json({ data: { id: memberId, status: 'active' } });
});
