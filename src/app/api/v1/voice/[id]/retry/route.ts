import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { AppError } from '@/lib/errors';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { voiceService } from '@/modules/voice/services/voice-service';

export const dynamic = 'force-dynamic';

async function getVoiceId(context: { params: Promise<Record<string, string>> | Record<string, string> } | undefined) {
  const params = await Promise.resolve(context?.params ?? {});
  return params.id;
}

export const POST = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request);
  const id = await getVoiceId(context);
  if (!id) throw new AppError('VALIDATION_ERROR', 400, 'Missing voice id');
  return NextResponse.json(await voiceService.retry(user, id));
});
