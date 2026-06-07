import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { type Prisma } from '@prisma/client';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { recalculateLeadScore } from '@/modules/crm/services/scoring-service';
import prisma from '@/lib/prisma';

async function getLeadId(context: { params: Promise<Record<string, string>> | Record<string, string> } | undefined) {
  return (await Promise.resolve(context!.params)).id;
}

const LogActivitySchema = z.object({
  type: z.enum(['call', 'meeting', 'whatsapp', 'email', 'other']),
  description: z.string().min(1).max(1000),
  metadata: z.object({
    duration_mins: z.number().int().positive().optional(),
    outcome: z.enum(['positive', 'neutral', 'negative']).optional(),
  }).optional(),
});

export const GET = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request);
  const leadId = await getLeadId(context);

  const lead = await prisma.lead.findFirst({ where: { id: leadId, tenantId: user.tenantId } });
  if (!lead) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Lead not found' } }, { status: 404 });

  const page = Number(request.nextUrl.searchParams.get('page') ?? 1);
  const limit = Number(request.nextUrl.searchParams.get('limit') ?? 20);
  const type = request.nextUrl.searchParams.get('type');

  const where: Prisma.ActivityWhereInput = { leadId, tenantId: user.tenantId };
  if (type) where.type = type;

  const [activities, total] = await Promise.all([
    prisma.activity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: { id: true, name: true } } },
    }),
    prisma.activity.count({ where }),
  ]);

  return NextResponse.json({ data: activities, meta: { page, limit, total, total_pages: Math.ceil(total / limit) } });
});

export const POST = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request);
  const leadId = await getLeadId(context);

  const lead = await prisma.lead.findFirst({ where: { id: leadId, tenantId: user.tenantId } });
  if (!lead) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Lead not found' } }, { status: 404 });

  const body = await request.json();
  const input = LogActivitySchema.parse(body);

  const activity = await prisma.activity.create({
    data: {
      tenantId: user.tenantId,
      leadId,
      userId: user.id,
      type: input.type,
      description: input.description,
      ...(input.metadata && { metadata: input.metadata as Prisma.InputJsonValue }),
    },
    include: { user: { select: { id: true, name: true } } },
  });

  // Side effects: recalculate score + touch updatedAt
  await Promise.all([
    recalculateLeadScore(leadId),
    prisma.lead.update({ where: { id: leadId }, data: { updatedAt: new Date() } }),
  ]);

  return NextResponse.json({ data: activity }, { status: 201 });
});
