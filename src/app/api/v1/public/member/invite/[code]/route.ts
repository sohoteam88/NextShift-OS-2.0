import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { inviteService } from '@/modules/member/services/invite-service';

export const GET = apiHandler(async (_request: NextRequest, context) => {
  const params = await context?.params;
  const code = params?.code ?? '';

  const invite = await inviteService.validateInvite(code);
  return NextResponse.json({ data: invite });
});
