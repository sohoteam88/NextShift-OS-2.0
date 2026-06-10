import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { AppError } from '@/lib/errors';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { brandInterviewService } from '@/modules/brand-builder/services/brand-interview-service';

export const dynamic = 'force-dynamic';

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const body = (await request.json()) as { mode?: string; opening?: string };
  const mode = body.mode;

  if (mode !== 'voice' && mode !== 'text' && mode !== 'dialogue') {
    throw new AppError('VALIDATION_ERROR', 400, "mode must be 'voice', 'text', or 'dialogue'");
  }

  const interview = await brandInterviewService.create(
    user,
    mode,
    typeof body.opening === 'string' ? body.opening : undefined,
  );
  return NextResponse.json({ data: interview }, { status: 201 });
});

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const interview = await brandInterviewService.getUserLatestInterview(user.id, user.tenantId);
  return NextResponse.json({ data: interview });
});
