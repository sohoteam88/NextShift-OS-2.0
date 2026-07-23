import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { sharedAiRateLimitGuard } from '@/lib/ai-rate-limit';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { whatsappService } from '@/modules/whatsapp-ai/whatsappService';
import { notifyMissionProgress } from '@/modules/mission/utils/complete-mission';

export const POST = apiHandler(async (req: NextRequest) => {
  const user = await requireAuthApi(req);
  await sharedAiRateLimitGuard(user, { feature: 'whatsapp-ai' });
  const data = await whatsappService.generate(user.id, user.tenantId);
  await notifyMissionProgress(user, 'whatsapp_followup_configured');
  return NextResponse.json({ data });
});
