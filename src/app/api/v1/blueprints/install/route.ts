import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { blueprintService } from '@/modules/blueprints/blueprintService';

export const POST = apiHandler(async (req: NextRequest) => {
  const user = await requireAuthApi(req);
  const { blueprintId } = z.object({ blueprintId: z.string() }).parse(await req.json());
  return NextResponse.json({ data: await blueprintService.install(user.id, user.tenantId, blueprintId) });
});
