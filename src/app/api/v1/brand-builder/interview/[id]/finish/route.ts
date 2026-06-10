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
  const body = (await request.json().catch(() => ({}))) as { ended_by?: string };
  const endedBy = body.ended_by === 'ai' || body.ended_by === 'hardcap' ? body.ended_by : 'user';

  const interview = await brandInterviewService.getInterview(id, user.tenantId);
  if (!interview) throw new AppError('NOT_FOUND', 404, 'Interview not found');

  const profile = await brandInterviewService.finishDialogue(id, user, endedBy);
  return NextResponse.json({ data: profile });
});
