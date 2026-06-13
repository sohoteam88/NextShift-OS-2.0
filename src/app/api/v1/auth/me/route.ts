import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import prisma from '@/lib/prisma';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);

  const tenant = await prisma.tenant.findUnique({
    where: { id: user.tenantId },
    select: { id: true, name: true, slug: true, plan: true, settings: true, maxAiCalls: true },
  });

  return NextResponse.json({ data: { user, tenant } });
});
