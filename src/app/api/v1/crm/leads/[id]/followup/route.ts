import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { followupService } from '@/modules/crm/services/followup-service';
import { AppError } from '@/lib/errors';

async function getLeadId(context: { params: Promise<Record<string, string>> | Record<string, string> } | undefined) {
  return (await Promise.resolve(context!.params)).id;
}

const SetFollowupSchema = z.object({
  next_followup: z.string().datetime().nullable(),
});

export const PATCH = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request);
  const leadId = await getLeadId(context);
  const body = await request.json();
  const { next_followup } = SetFollowupSchema.parse(body);

  const date = next_followup ? new Date(next_followup) : null;
  const result = await followupService.setFollowup(user, leadId, date);

  if (result === null && next_followup !== null) {
    throw new AppError('NOT_FOUND', 404, 'Lead not found');
  }

  return NextResponse.json({ data: { next_followup: date } });
});
