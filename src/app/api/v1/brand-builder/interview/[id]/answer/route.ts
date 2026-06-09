import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { AppError } from '@/lib/errors';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { brandInterviewService } from '@/modules/brand-builder/services/brand-interview-service';

export const dynamic = 'force-dynamic';

async function getId(context: { params: Promise<Record<string, string>> | Record<string, string> } | undefined) {
  return (await Promise.resolve(context!.params)).id;
}

export const PATCH = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request);
  const id = await getId(context);
  const body = (await request.json()) as { question_id?: string; answer?: string };

  if (!body.question_id || typeof body.answer !== 'string') {
    throw new AppError('VALIDATION_ERROR', 400, 'question_id and answer are required');
  }

  const interview = await brandInterviewService.getInterview(id, user.tenantId);
  if (!interview) throw new AppError('NOT_FOUND', 404, 'Interview not found');

  const updated = await brandInterviewService.saveAnswer(id, body.question_id, body.answer);
  return NextResponse.json({ data: updated });
});
