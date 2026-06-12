import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { getAllAchievementDefs, getUserAchievements } from '@/modules/mission/services/achievement-service';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const [unlocked, all] = await Promise.all([getUserAchievements(user), Promise.resolve(getAllAchievementDefs())]);
  return NextResponse.json({ data: { unlocked, all } });
});
