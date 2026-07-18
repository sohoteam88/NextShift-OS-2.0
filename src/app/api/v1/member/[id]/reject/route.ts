import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';
import { approvalService } from '@/modules/member/services/approval-service';
import { requireCanonicalMutationPath } from '@/lib/navigation/mutation-compatibility';

const RejectSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export const POST = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request);
  requireRoleApi(user, ['leader', 'operator']);
  requireCanonicalMutationPath(request, '/api/v1/admin/members/:id/reject');
  const params = await context?.params;
  const memberId = params?.id ?? '';
  const body = await request.json().catch(() => ({}));
  const input = RejectSchema.parse(body);

  await approvalService.reject(user, memberId, input.reason);
  return NextResponse.json({ data: { id: memberId, status: 'suspended' } });
});
