import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';
import { approvalService } from '@/modules/member/services/approval-service';
import { requireCanonicalMutationPath } from '@/lib/navigation/mutation-compatibility';

export const POST = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request);
  requireRoleApi(user, ['leader', 'operator']);
  requireCanonicalMutationPath(request, '/api/v1/admin/members/:id/approve');
  const params = await context?.params;
  const memberId = params?.id ?? '';

  await approvalService.approve(user, memberId);
  return NextResponse.json({ data: { id: memberId, status: 'active' } });
});
