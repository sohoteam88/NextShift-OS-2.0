import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { AppError } from '@/lib/errors';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { brandInterviewService } from '@/modules/brand-builder/services/brand-interview-service';

export const dynamic = 'force-dynamic';

async function getId(context: { params: Promise<Record<string, string>> | Record<string, string> } | undefined) {
  return (await Promise.resolve(context!.params)).id;
}

export const POST = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request);
  const id = await getId(context);
  const body = (await request.json()) as { profile?: Record<string, unknown> };

  if (!body.profile || typeof body.profile !== 'object') {
    throw new AppError('VALIDATION_ERROR', 400, 'profile is required');
  }

  const interview = await brandInterviewService.getInterview(id, user.tenantId);
  if (!interview) throw new AppError('NOT_FOUND', 404, 'Interview not found');

  const confirmed = await brandInterviewService.confirmProfile(id, user, body.profile);
  return NextResponse.json({ data: confirmed });
});
