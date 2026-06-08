import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import prisma from '@/lib/prisma';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const limit = Number(request.nextUrl.searchParams.get('limit') ?? 10);

  const ownerFilter =
    user.role === 'member'
      ? { lead: { ownerId: user.id } }
      : {};

  const activities = await prisma.activity.findMany({
    where: { tenantId: user.tenantId, ...ownerFilter },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      user: { select: { id: true, name: true } },
      lead: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ data: activities });
});
