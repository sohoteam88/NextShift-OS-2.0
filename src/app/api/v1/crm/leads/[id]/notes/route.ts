import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { logActivity } from '@/modules/crm/services/activity-service';
import prisma from '@/lib/prisma';

async function getLeadId(context: { params: Promise<Record<string, string>> | Record<string, string> } | undefined) {
  return (await Promise.resolve(context!.params)).id;
}

const CreateNoteSchema = z.object({
  content: z.string().min(1).max(2000),
});

export const GET = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request);
  const leadId = await getLeadId(context);

  const lead = await prisma.lead.findFirst({ where: { id: leadId, tenantId: user.tenantId } });
  if (!lead) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Lead not found' } }, { status: 404 });

  const page = Number(request.nextUrl.searchParams.get('page') ?? 1);
  const limit = Number(request.nextUrl.searchParams.get('limit') ?? 20);

  const [notes, total] = await Promise.all([
    prisma.note.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: { id: true, name: true } } },
    }),
    prisma.note.count({ where: { leadId } }),
  ]);

  return NextResponse.json({ data: notes, meta: { page, limit, total, total_pages: Math.ceil(total / limit) } });
});

export const POST = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request);
  const leadId = await getLeadId(context);

  const lead = await prisma.lead.findFirst({ where: { id: leadId, tenantId: user.tenantId } });
  if (!lead) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Lead not found' } }, { status: 404 });

  const body = await request.json();
  const { content } = CreateNoteSchema.parse(body);

  const note = await prisma.note.create({
    data: { leadId, userId: user.id, content },
    include: { user: { select: { id: true, name: true } } },
  });

  await logActivity({
    tenantId: user.tenantId,
    leadId,
    userId: user.id,
    type: 'note_added',
    description: `Note added: ${content.slice(0, 80)}${content.length > 80 ? '...' : ''}`,
  });

  return NextResponse.json({ data: note }, { status: 201 });
});
