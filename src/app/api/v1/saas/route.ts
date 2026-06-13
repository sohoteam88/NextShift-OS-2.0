import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { saasService } from '@/modules/saas/saasService';

export const GET = apiHandler(async (req: NextRequest) => {
  const user = await requireAuthApi(req);
  const [subscription, recommendations] = await Promise.all([
    saasService.getSubscription(user.tenantId),
    saasService.getUpgradeRecommendations(user.id),
  ]);
  return NextResponse.json({ data: { subscription, recommendations } });
});
