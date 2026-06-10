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
  const body = (await request.json()) as { content?: string; type?: string; audio_url?: string };

  if (!body.content || typeof body.content !== 'string') {
    throw new AppError('VALIDATION_ERROR', 400, 'content is required');
  }
  if (body.type && body.type !== 'text' && body.type !== 'voice') {
    throw new AppError('VALIDATION_ERROR', 400, "type must be 'text' or 'voice'");
  }

  const result = await brandInterviewService.sendDialogueMessage(id, user, {
    content: body.content,
    type: body.type === 'voice' ? 'voice' : 'text',
    audioUrl: typeof body.audio_url === 'string' ? body.audio_url : undefined,
  });

  return NextResponse.json({ data: result });
});
