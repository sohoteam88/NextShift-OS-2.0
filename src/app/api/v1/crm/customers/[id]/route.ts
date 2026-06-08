import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import prisma from '@/lib/prisma';

async function getCustomerId(context: { params: Promise<Record<string, string>> | Record<string, string> } | undefined) {
  return (await Promise.resolve(context!.params)).id;
}

const UpdateCustomerSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  phone: z.string().max(50).nullable().optional(),
  email: z.string().email().nullable().optional(),
  productName: z.string().max(200).nullable().optional(),
  purchaseDate: z.string().datetime().optional(),
  nextFollowup: z.string().datetime().nullable().optional(),
  status: z.enum(['active', 'at_risk', 'churned']).optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export const GET = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request);
  const id = await getCustomerId(context);

  const where = user.role === 'member'
    ? { id, tenantId: user.tenantId, ownerId: user.id }
    : { id, tenantId: user.tenantId };

  const customer = await prisma.customer.findFirst({
    where,
    include: {
      owner: { select: { id: true, name: true } },
      lead: { select: { id: true, name: true, pipelineStage: true, score: true } },
    },
  });

  if (!customer) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Customer not found' } }, { status: 404 });
  }

  return NextResponse.json({ data: customer });
});

export const PATCH = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request);
  const id = await getCustomerId(context);

  const where = user.role === 'member'
    ? { id, tenantId: user.tenantId, ownerId: user.id }
    : { id, tenantId: user.tenantId };

  const existing = await prisma.customer.findFirst({ where });
  if (!existing) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Customer not found' } }, { status: 404 });
  }

  const body = await request.json();
  const input = UpdateCustomerSchema.parse(body);

  const updated = await prisma.customer.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.productName !== undefined ? { productName: input.productName } : {}),
      ...(input.purchaseDate !== undefined ? { purchaseDate: new Date(input.purchaseDate) } : {}),
      ...(input.nextFollowup !== undefined ? { nextFollowup: input.nextFollowup ? new Date(input.nextFollowup) : null } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      updatedAt: new Date(),
    },
    include: {
      owner: { select: { id: true, name: true } },
      lead: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ data: updated });
});

export const DELETE = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request);
  const id = await getCustomerId(context);

  const where = user.role === 'member'
    ? { id, tenantId: user.tenantId, ownerId: user.id }
    : { id, tenantId: user.tenantId };

  const existing = await prisma.customer.findFirst({ where });
  if (!existing) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Customer not found' } }, { status: 404 });
  }

  await prisma.customer.delete({ where: { id } });
  return NextResponse.json({ data: { deleted: true } });
});
