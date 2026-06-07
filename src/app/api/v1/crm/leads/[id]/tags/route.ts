import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { tagService } from '@/modules/crm/services/tag-service';
import prisma from '@/lib/prisma';

async function getLeadId(context: { params: Promise<Record<string, string>> | Record<string, string> } | undefined) {
  return (await Promise.resolve(context!.params)).id;
}

const SetTagsSchema = z.object({
  tag_ids: z.array(z.string().uuid()),
});

export const POST = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request);
  const leadId = await getLeadId(context);

  const lead = await prisma.lead.findFirst({ where: { id: leadId, tenantId: user.tenantId } });
  if (!lead) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Lead not found' } }, { status: 404 });
  }

  const body = await request.json();
  const { tag_ids } = SetTagsSchema.parse(body);
  const updated = await tagService.setLeadTags(leadId, user.tenantId, tag_ids);
  return NextResponse.json({ data: updated });
});
