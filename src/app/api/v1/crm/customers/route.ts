import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import prisma from '@/lib/prisma';

const CreateCustomerSchema = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().max(50).optional(),
  email: z.string().email().optional(),
  productName: z.string().max(200).optional(),
  purchaseDate: z.string().datetime(),
  nextFollowup: z.string().datetime().optional(),
  leadId: z.string().uuid().optional(),
  notes: z.string().max(2000).optional(),
});

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);

  const status = request.nextUrl.searchParams.get('status');
  const page = Math.max(1, Number(request.nextUrl.searchParams.get('page') ?? 1));
  const limit = Math.min(50, Number(request.nextUrl.searchParams.get('limit') ?? 20));

  const where = {
    tenantId: user.tenantId,
    ...(user.role === 'member' ? { ownerId: user.id } : {}),
    ...(status ? { status } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: [{ nextFollowup: 'asc' }, { createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
      include: {
        owner: { select: { id: true, name: true } },
        lead: { select: { id: true, name: true, pipelineStage: true } },
      },
    }),
    prisma.customer.count({ where }),
  ]);

  return NextResponse.json({
    data: items,
    meta: { page, limit, total, total_pages: Math.ceil(total / limit) },
  });
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);

  const body = await request.json();
  const input = CreateCustomerSchema.parse(body);

  const customer = await prisma.customer.create({
    data: {
      tenantId: user.tenantId,
      ownerId: user.id,
      name: input.name,
      phone: input.phone ?? null,
      email: input.email ?? null,
      productName: input.productName ?? null,
      purchaseDate: new Date(input.purchaseDate),
      nextFollowup: input.nextFollowup ? new Date(input.nextFollowup) : null,
      leadId: input.leadId ?? null,
      notes: input.notes ?? null,
    },
    include: {
      owner: { select: { id: true, name: true } },
      lead: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ data: customer }, { status: 201 });
});
