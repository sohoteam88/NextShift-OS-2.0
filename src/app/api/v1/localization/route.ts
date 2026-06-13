import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { localizationService } from '@/modules/localization/localizationService';

export const GET = apiHandler(async (req: NextRequest) => {
  const user = await requireAuthApi(req);
  const [health, profiles] = await Promise.all([
    localizationService.getLocalizationHealth(user.id),
    Promise.resolve(localizationService.getLanguageProfiles()),
  ]);
  return NextResponse.json({ data: { health, profiles } });
});
