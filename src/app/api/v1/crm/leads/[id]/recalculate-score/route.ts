import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';
import { recalculateLeadScore } from '@/modules/crm/services/scoring-service';
import prisma from '@/lib/prisma';

async function getLeadId(context: { params: Promise<Record<string, string>> | Record<string, string> } | undefined) {
  return (await Promise.resolve(context!.params)).id;
}

export const POST = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request);
  requireRoleApi(user, ['member', 'leader', 'operator', 'platform_admin']);
  const leadId = await getLeadId(context);

  const lead = await prisma.lead.findFirst({ where: { id: leadId, tenantId: user.tenantId } });
  if (!lead) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Lead not found' } }, { status: 404 });
  }

  const score = await recalculateLeadScore(leadId);

  const updated = await prisma.lead.findUnique({ where: { id: leadId }, select: { score: true, scoreReasons: true } });

  return NextResponse.json({ data: { score, reasons: updated?.scoreReasons ?? [] } });
});
