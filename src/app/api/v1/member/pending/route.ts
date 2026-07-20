import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';
import { approvalService } from '@/modules/member/services/approval-service';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  requireRoleApi(user, ['leader', 'operator']);
  const members = await approvalService.getPendingMembers(user);

  return NextResponse.json({
    data: members,
    meta: { total: members.length },
  });
});
