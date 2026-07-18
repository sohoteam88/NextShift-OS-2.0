import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { getSearchParams } from '@/lib/query-helpers';
import prisma from '@/lib/prisma';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  requireRoleApi(user, ['platform_admin']);
  const query = getSearchParams(request);
  const page = Math.max(1, Number(query.page ?? 1));
  const limit = Math.min(50, Math.max(1, Number(query.limit ?? 20)));
  const where = {
    ...(query.status ? { status: String(query.status) } : {}),
    ...(query.type ? { type: String(query.type) } : {}),
  };
  const [data, total] = await Promise.all([
    prisma.feedback.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
    prisma.feedback.count({ where }),
  ]);
  return NextResponse.json({ data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});
