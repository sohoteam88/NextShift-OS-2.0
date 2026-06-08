import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { whatsappReplyService } from '@/modules/ai/services/whatsapp-reply-service';

const WhatsAppReplySchema = z.object({
  leadId: z.string().uuid(),
  messageContext: z.string().min(1),
  language: z.enum(['zh', 'en', 'ms']).optional(),
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const body = await request.json();
  const input = WhatsAppReplySchema.parse(body);
  const result = await whatsappReplyService.suggest(user, input);
  return NextResponse.json({ data: result });
});
