import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { blueprintService } from '@/modules/blueprints/blueprintService';

export const GET = apiHandler(async (req: NextRequest) => {
  const user = await requireAuthApi(req);
  const [available, installed] = await Promise.all([
    Promise.resolve(blueprintService.getAvailable()),
    blueprintService.getInstallState(user.id),
  ]);
  return NextResponse.json({ data: { available, installed } });
});
