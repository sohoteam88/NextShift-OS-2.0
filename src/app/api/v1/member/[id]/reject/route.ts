import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { approvalService } from '@/modules/member/services/approval-service';

const RejectSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export const POST = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request);
  const params = await context?.params;
  const memberId = params?.id ?? '';
  const body = await request.json().catch(() => ({}));
  const input = RejectSchema.parse(body);

  await approvalService.reject(user, memberId, input.reason);
  return NextResponse.json({ data: { id: memberId, status: 'suspended' } });
});
