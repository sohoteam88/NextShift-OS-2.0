import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { whatsappService } from '@/modules/whatsapp-ai/whatsappService';
export const GET = apiHandler(async (req: NextRequest) => {
  const user = await requireAuthApi(req);
  const [data, crm] = await Promise.all([whatsappService.get(user.id), whatsappService.getCRMContext(user.id)]);
  return NextResponse.json({ data, crm });
});
