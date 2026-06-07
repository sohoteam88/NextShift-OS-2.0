import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { AppError } from '@/lib/errors';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { voiceService } from '@/modules/voice/services/voice-service';
import type { VoiceLanguage } from '@/modules/voice/types';

export const dynamic = 'force-dynamic';

const allowedLanguages = new Set<VoiceLanguage>(['zh', 'en', 'ms']);

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const formData = await request.formData();

  const file = formData.get('file');
  if (!(file instanceof File)) {
    throw new AppError('VALIDATION_ERROR', 400, 'No audio file provided');
  }

  const language = String(formData.get('language') ?? user.preferredLanguage ?? 'zh') as VoiceLanguage;
  if (!allowedLanguages.has(language)) {
    throw new AppError('VALIDATION_ERROR', 400, 'Unsupported language');
  }

  const durationValue = formData.get('duration_secs');
  const durationSecs =
    typeof durationValue === 'string' && durationValue.trim()
      ? Number(durationValue)
      : undefined;

  const result = await voiceService.upload(user, {
    file,
    language,
    durationSecs: Number.isFinite(durationSecs) ? Math.max(0, Math.round(durationSecs ?? 0)) : undefined,
  });

  return NextResponse.json(result);
});
