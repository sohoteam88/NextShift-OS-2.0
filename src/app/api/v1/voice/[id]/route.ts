import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { AppError } from '@/lib/errors';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { voiceService } from '@/modules/voice/services/voice-service';

export const dynamic = 'force-dynamic';

async function getVoiceId(context: { params: Promise<Record<string, string>> | Record<string, string> } | undefined) {
  const params = await Promise.resolve(context?.params ?? {});
  return params.id;
}

const patchSchema = z.object({
  transcript: z.string().optional(),
  extractedData: z.record(z.string(), z.any()).optional(),
  status: z.enum(['review', 'failed']).optional(),
});

export const GET = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request);
  const id = await getVoiceId(context);
  if (!id) throw new AppError('VALIDATION_ERROR', 400, 'Missing voice id');
  return NextResponse.json(await voiceService.getById(user, id));
});

export const PATCH = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request);
  const id = await getVoiceId(context);
  if (!id) throw new AppError('VALIDATION_ERROR', 400, 'Missing voice id');
  const payload = patchSchema.parse(await request.json());
  return NextResponse.json(await voiceService.update(user, id, payload));
});

export const DELETE = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request);
  const id = await getVoiceId(context);
  if (!id) throw new AppError('VALIDATION_ERROR', 400, 'Missing voice id');
  return NextResponse.json(await voiceService.remove(user, id));
});
