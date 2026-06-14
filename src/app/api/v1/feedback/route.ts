import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const SubmitSchema = z.object({
  type: z.enum(['bug', 'feature', 'ux', 'general']),
  severity: z.enum(['critical', 'major', 'minor', 'suggestion']).optional(),
  message: z.string().min(5).max(2000),
  route: z.string().optional(),
  metadata: z.object({}).passthrough().optional(),
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const body = await request.json();
  const input = SubmitSchema.parse(body) as z.infer<typeof SubmitSchema>;

  const feedback = await prisma.feedback.create({
    data: {
      tenantId: user.tenantId,
      userId: user.id,
      type: input.type,
      severity: input.severity ?? null,
      message: input.message,
      route: input.route ?? null,
      metadata: (input.metadata ?? {}) as any,
      status: 'open',
    },
  });

  return NextResponse.json({ data: feedback }, { status: 201 });
});

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20')));
  const status = searchParams.get('status');

  const where: any = { tenantId: user.tenantId };
  if (status) where.status = status;

  const [items, total] = await Promise.all([
    prisma.feedback.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: { id: true, type: true, severity: true, message: true, route: true, status: true, createdAt: true, updatedAt: true },
    }),
    prisma.feedback.count({ where }),
  ]);

  return NextResponse.json({ data: items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});
