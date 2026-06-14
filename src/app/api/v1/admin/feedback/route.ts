import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';
import prisma from '@/lib/prisma';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  requireRoleApi(user, ['platform_admin', 'operator']);

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20')));
  const status = searchParams.get('status');
  const type = searchParams.get('type');

  const where: any = {};
  if (status) where.status = status;
  if (type) where.type = type;

  const [items, total] = await Promise.all([
    prisma.feedback.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, type: true, severity: true, message: true, route: true,
        metadata: true, status: true, createdAt: true, updatedAt: true,
        tenantId: true, userId: true,
      },
    }),
    prisma.feedback.count({ where }),
  ]);

  return NextResponse.json({ data: items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});
